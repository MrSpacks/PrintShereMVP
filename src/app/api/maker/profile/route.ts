import { NextResponse } from "next/server";

import { geocodeAddress } from "@/lib/geocoding/nominatim";
import { OCCASIONAL_INCOME_LIMIT_CZK } from "@/lib/legal/constants";
import { mapPrismaMakerProfile } from "@/lib/makers/map-maker";
import { getMakerYearToDatePrintIncomeCzk } from "@/lib/makers/maker-income-gate";
import {
  normalizeMakerIco,
  remainingOccasionalIncomeCzk,
  validateMakerIcoInput,
} from "@/lib/makers/occasional-income";
import { requireMakerUser, unauthorized } from "@/lib/maker/require-maker";
import { prisma } from "@/lib/prisma";
import type { UpdateMakerProfilePayload, PrinterType } from "@/types/maker";

const PRINTER_TYPES = new Set<string>(["fdm", "resin"]);
const STATUSES = new Set<string>(["available", "busy", "hidden"]);

function isUpdateBody(body: unknown): body is UpdateMakerProfilePayload {
  if (!body || typeof body !== "object") return false;
  const p = body as Record<string, unknown>;
  return (
    typeof p.name === "string" &&
    typeof p.address === "string" &&
    typeof p.pricePerGramFdmCzk === "number" &&
    typeof p.pricePerGramResinCzk === "number" &&
    typeof p.minOrderPriceCzk === "number" &&
    typeof p.offersDelivery === "boolean" &&
    typeof p.deliveryPriceCzk === "number" &&
    Array.isArray(p.printerTypes) &&
    typeof p.status === "string" &&
    (p.companyId === undefined ||
      p.companyId === null ||
      typeof p.companyId === "string")
  );
}

function validatePricePerGram(value: number): boolean {
  return value > 0 && value <= 50;
}

export async function GET() {
  const user = await requireMakerUser();
  if (!user || !user.maker) return unauthorized();

  const profile = mapPrismaMakerProfile(user.maker);
  const ytd = await getMakerYearToDatePrintIncomeCzk(user.maker.id);
  const remaining = remainingOccasionalIncomeCzk(ytd, user.maker.companyId);

  return NextResponse.json({
    profile: {
      ...profile,
      yearToDatePrintIncomeCzk: ytd,
      occasionalIncomeLimitCzk: OCCASIONAL_INCOME_LIMIT_CZK,
      occasionalIncomeRemainingCzk: remaining,
    },
  });
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

    const printerTypes = body.printerTypes.filter((t): t is PrinterType =>
      PRINTER_TYPES.has(t)
    );

    if (printerTypes.length === 0) {
      return NextResponse.json(
        { error: "Select at least one printer type" },
        { status: 400 }
      );
    }

    if (printerTypes.includes("fdm") && !validatePricePerGram(body.pricePerGramFdmCzk)) {
      return NextResponse.json({ error: "Invalid FDM price per gram" }, { status: 400 });
    }

    if (
      printerTypes.includes("resin") &&
      !validatePricePerGram(body.pricePerGramResinCzk)
    ) {
      return NextResponse.json(
        { error: "Invalid resin price per gram" },
        { status: 400 }
      );
    }

    if (body.minOrderPriceCzk < 0) {
      return NextResponse.json({ error: "Min order price cannot be negative" }, { status: 400 });
    }

    if (body.deliveryPriceCzk < 0) {
      return NextResponse.json(
        { error: "Delivery price cannot be negative" },
        { status: 400 }
      );
    }

    if (body.offersDelivery && body.deliveryPriceCzk <= 0) {
      return NextResponse.json(
        { error: "Set a delivery price greater than 0, or turn delivery off" },
        { status: 400 }
      );
    }

    if (!STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (body.companyId !== undefined) {
      const icoError = validateMakerIcoInput(body.companyId);
      if (icoError) {
        return NextResponse.json({ error: icoError }, { status: 400 });
      }
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
        pricePerGramFdmCzk: body.pricePerGramFdmCzk,
        pricePerGramResinCzk: body.pricePerGramResinCzk,
        minOrderPriceCzk: body.minOrderPriceCzk,
        offersDelivery: body.offersDelivery,
        deliveryPriceCzk: body.offersDelivery ? body.deliveryPriceCzk : 0,
        printerTypes,
        status: body.status,
        ...(body.companyId !== undefined && {
          companyId: normalizeMakerIco(body.companyId),
        }),
      },
      include: {
        filaments: { orderBy: [{ printerType: "asc" }, { material: "asc" }] },
        printers: { orderBy: { createdAt: "asc" } },
      },
    });

    const ytd = await getMakerYearToDatePrintIncomeCzk(updated.id);
    const remaining = remainingOccasionalIncomeCzk(ytd, updated.companyId);

    return NextResponse.json({
      profile: {
        ...mapPrismaMakerProfile(updated),
        yearToDatePrintIncomeCzk: ytd,
        occasionalIncomeLimitCzk: OCCASIONAL_INCOME_LIMIT_CZK,
        occasionalIncomeRemainingCzk: remaining,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/maker/profile]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
