import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !session.makerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const printer = await prisma.makerPrinter.findUnique({
    where: { id: params.id },
  });

  if (!printer || printer.makerId !== session.makerId) {
    return NextResponse.json({ error: "Printer not found" }, { status: 404 });
  }

  await prisma.makerPrinter.delete({
    where: { id: params.id },
  });

  // Check if we need to update printerTypes
  const remainingPrinters = await prisma.makerPrinter.findMany({
    where: { makerId: session.makerId },
    select: { technology: true },
  });

  const types = new Set(remainingPrinters.map((p) => p.technology));

  await prisma.maker.update({
    where: { id: session.makerId },
    data: { printerTypes: Array.from(types) },
  });

  return NextResponse.json({ success: true });
}
