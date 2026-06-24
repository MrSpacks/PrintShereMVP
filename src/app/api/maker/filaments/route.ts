import { NextResponse } from "next/server";

import {
  getColorOptions,
  getMaterialOptions,
} from "@/lib/makers/filament-options";
import { mapFilament } from "@/lib/makers/map-maker";
import {
  requireMakerUser,
  unauthorized,
} from "@/lib/maker/require-maker";
import { prisma } from "@/lib/prisma";
import type { AddFilamentPayload, PrinterType } from "@/types/maker";

const PRINTER_TYPES = new Set<string>(["fdm", "resin"]);

function isAddBody(body: unknown): body is AddFilamentPayload {
  if (!body || typeof body !== "object") return false;
  const p = body as Record<string, unknown>;
  return (
    typeof p.printerType === "string" &&
    typeof p.material === "string" &&
    typeof p.color === "string"
  );
}

export async function POST(request: Request) {
  const user = await requireMakerUser();
  if (!user) return unauthorized();

  try {
    const body: unknown = await request.json();
    if (!isAddBody(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (!PRINTER_TYPES.has(body.printerType)) {
      return NextResponse.json({ error: "Invalid printer type" }, { status: 400 });
    }

    const printerType = body.printerType as PrinterType;

    if (!user.maker) {
      return NextResponse.json({ error: "Maker profile not found" }, { status: 404 });
    }

    if (!user.maker.printerTypes.includes(printerType)) {
      return NextResponse.json(
        { error: "Enable this printer type in workshop settings first" },
        { status: 400 }
      );
    }

    const materials = getMaterialOptions(printerType);
    const colors = getColorOptions(printerType, body.material);

    if (!materials.includes(body.material)) {
      return NextResponse.json({ error: "Invalid material" }, { status: 400 });
    }

    if (!colors.includes(body.color)) {
      return NextResponse.json({ error: "Invalid color" }, { status: 400 });
    }

    const filament = await prisma.makerFilament.create({
      data: {
        makerId: user.maker.id,
        printerType,
        material: body.material,
        color: body.color,
      },
    });

    return NextResponse.json(
      { filament: mapFilament(filament) },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "This material and color is already added" },
        { status: 409 }
      );
    }

    console.error("[POST /api/maker/filaments]", error);
    return NextResponse.json({ error: "Failed to add filament" }, { status: 500 });
  }
}
