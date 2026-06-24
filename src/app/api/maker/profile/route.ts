import { NextResponse } from "next/server";

import { geocodeAddress } from "@/lib/geocoding/nominatim";
import { mapPrismaMakerProfile } from "@/lib/makers/map-maker";
import { requireMakerUser, unauthorized } from "@/lib/maker/require-maker";
import { prisma } from "@/lib/prisma";
import type { UpdateMakerProfilePayload } from "@/types/maker";
import type { PrinterType } from "@/types/maker";

const PRINTER_TYPES = new Set<string>(["fdm", "resin"]);
const STATUSES = new Set<string>(["available", "busy"]);

function isUpdateBody(body: unknown): body is UpdateMakerProfilePayload {
  if (!body || typeof body !== "object") return false;
  const p = body as Record<string, unknown>;
  return (
    typeof p.name === "string" &&
    typeof p.address === "string" &&
    typeof p.pricePerGramCzk === "number" &&
    typeof p.minOrderPriceCzk === "number" &&
    Array.isArray(p.printerTypes) &&
    typeof p.status === "string"
  );
}

export async function GET() {
  const user = await requireMakerUser();
  if (!user || !user.maker) return unauthorized();

  return NextResponse.json({ profile: mapPrismaMakerProfile(user.maker) });
}

export async function PATCH(request: Request) {
  const user = await requireMakerUser();
  if (!user) return unauthorized();

  try {
    const body: unknown = await request.json();
    if (!isUpdateBody(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const name = body.name.trim();
    const address = body.address.trim();

    if (name.length < 2) {
      return NextResponse.json({ error: "Workshop name is too short" }, { status: 400 });
    }

    if (address.length < 5) {
      return NextResponse.json({ error: "Address is too short" }, { status: 400 });
    }

    if (body.pricePerGramCzk <= 0 || body.pricePerGramCzk > 50) {
      return NextResponse.json({ error: "Invalid price per gram" }, { status: 400 });
    }

    if (body.minOrderPriceCzk < 0) {
      return NextResponse.json({ error: "Min order price cannot be negative" }, { status: 400 });
    }

    const printerTypes = body.printerTypes.filter((t): t is PrinterType =>
      PRINTER_TYPES.has(t)
    );

    if (printerTypes.length === 0) {
      return NextResponse.json(
        { error: "Select at least one printer type" },
        { status: 400 }
      );
    }

    if (!STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const location = await geocodeAddress(address);
    if (!location) {
      return NextResponse.json(
        { error: "Could not locate address on the map" },
        { status: 422 }
      );
    }

    const updated = await prisma.maker.update({
      where: { id: user.maker!.id },
      data: {
        name,
        address: location.displayName,
        latitude: location.latitude,
        longitude: location.longitude,
        pricePerGramCzk: body.pricePerGramCzk,
        minOrderPriceCzk: body.minOrderPriceCzk,
        printerTypes,
        status: body.status,
      },
      include: {
        filaments: { orderBy: [{ printerType: "asc" }, { material: "asc" }] },
      },
    });

    return NextResponse.json({ profile: mapPrismaMakerProfile(updated) });
  } catch (error) {
    console.error("[PATCH /api/maker/profile]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
