import { NextResponse } from "next/server";

import {
  isOrderBlobStorageEnabled,
  isVercelBlobUrl,
  readOrderModelFile,
  saveOrderModelFile,
  toOrderFileDownloadUrl,
} from "@/lib/orders/order-file-storage";
import { mapOrder, ORDER_DETAIL_INCLUDE } from "@/lib/orders/map-order";
import {
  getOrderAccess,
  notFound,
  unauthorized,
} from "@/lib/orders/require-order-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface RouteParams {
  params: { id: string };
}

function isConfirmBody(body: unknown): body is { fileUrl: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { fileUrl?: unknown }).fileUrl === "string"
  );
}

export async function GET(_request: Request, { params }: RouteParams) {
  const access = await getOrderAccess(params.id);
  if (!access) return unauthorized();

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order?.fileUrl) return notFound();

  try {
    const { buffer, contentType } = await readOrderModelFile(
      order.fileUrl,
      order.fileName,
      params.id
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
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

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body: unknown = await request.json();
    if (!isConfirmBody(body) || !isVercelBlobUrl(body.fileUrl)) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    if (!body.fileUrl.includes(`/orders/${params.id}/`)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    if (order.fileUrl) {
      return NextResponse.json({
        fileUrl: toOrderFileDownloadUrl(params.id),
        order: mapOrder(
          await prisma.order.findUniqueOrThrow({
            where: { id: params.id },
            include: ORDER_DETAIL_INCLUDE,
          })
        ),
      });
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { fileUrl: body.fileUrl },
      include: ORDER_DETAIL_INCLUDE,
    });

    return NextResponse.json({
      fileUrl: toOrderFileDownloadUrl(params.id),
      order: mapOrder(updated),
    });
  }

  if (order.fileUrl) {
    return NextResponse.json({
      fileUrl: toOrderFileDownloadUrl(params.id),
    });
  }

  if (isOrderBlobStorageEnabled()) {
    return NextResponse.json(
      {
        error:
          "Use client upload for model files when Vercel Blob is enabled",
      },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const storedUrl = await saveOrderModelFile(params.id, order.fileName, file);

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { fileUrl: storedUrl },
      include: ORDER_DETAIL_INCLUDE,
    });

    return NextResponse.json({
      fileUrl: toOrderFileDownloadUrl(params.id),
      order: mapOrder(updated),
    });
  } catch (error) {
    console.error("[POST /api/orders/[id]/file]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
