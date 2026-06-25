import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

import { getOrderFileAbsolutePath } from "@/lib/orders/order-file-storage";
import {
  getOrderAccess,
  notFound,
  unauthorized,
} from "@/lib/orders/require-order-access";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const access = await getOrderAccess(params.id);
  if (!access) return unauthorized();

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order?.fileUrl) return notFound();

  try {
    const absolutePath = getOrderFileAbsolutePath(params.id, order.fileName);
    const buffer = await readFile(absolutePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${order.fileName}"`,
      },
    });
  } catch {
    return notFound();
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const access = await getOrderAccess(params.id);
  if (!access) return unauthorized();

  if (
    access.user.role !== "customer" ||
    access.order.customerId !== access.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return notFound();

  if (order.fileUrl) {
    return NextResponse.json({ fileUrl: order.fileUrl });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { saveOrderModelFile } = await import(
      "@/lib/orders/order-file-storage"
    );
    const fileUrl = await saveOrderModelFile(
      params.id,
      order.fileName,
      buffer
    );

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { fileUrl },
      include: { maker: true, customer: true },
    });

    const { mapOrder } = await import("@/lib/orders/map-order");
    return NextResponse.json({ fileUrl, order: mapOrder(updated) });
  } catch (error) {
    console.error("[POST /api/orders/[id]/file]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
