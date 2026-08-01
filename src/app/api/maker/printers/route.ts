import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { resolvePrinterModelLabel, CUSTOM_PRINTER_KEY } from "@/lib/makers/printer-catalog";
import type { PrinterType } from "@/types/maker";

export const dynamic = "force-dynamic";

interface AddPrinterPayload {
  technology: string;
  modelKey: string;
  customModelLabel?: string;
}

function isValidPayload(body: unknown): body is AddPrinterPayload {
  if (!body || typeof body !== "object") return false;
  const p = body as Record<string, unknown>;
  return (
    typeof p.technology === "string" &&
    typeof p.modelKey === "string" &&
    (p.customModelLabel === undefined || typeof p.customModelLabel === "string")
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { makerId: true },
  });

  if (!user?.makerId) {
    return NextResponse.json({ error: "Not a maker" }, { status: 403 });
  }

  const body: unknown = await request.json();
  
  if (!isValidPayload(body)) {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }

  if (!["fdm", "resin"].includes(body.technology)) {
    return NextResponse.json(
      { error: "Invalid printer technology" },
      { status: 400 }
    );
  }

  const resolved = resolvePrinterModelLabel(
    body.technology as PrinterType,
    body.modelKey,
    body.customModelLabel
  );

  const printer = await prisma.makerPrinter.create({
    data: {
      makerId: user.makerId,
      technology: body.technology,
      modelKey: resolved.modelKey,
      modelLabel: resolved.modelLabel,
      isCustom: resolved.isCustom,
    },
  });

  // Update printerTypes array on Maker
  const maker = await prisma.maker.findUnique({
    where: { id: user.makerId },
    select: { printerTypes: true },
  });

  const currentTypes = new Set(maker?.printerTypes ?? []);
  currentTypes.add(body.technology);

  await prisma.maker.update({
    where: { id: user.makerId },
    data: { printerTypes: Array.from(currentTypes) },
  });

  return NextResponse.json({
    success: true,
    printer: {
      id: printer.id,
      technology: printer.technology,
      modelKey: printer.modelKey,
      modelLabel: printer.modelLabel,
      isCustom: printer.isCustom,
    },
  });
}
