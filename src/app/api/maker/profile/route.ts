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
    Array.isArray(p.printerTypes) &&
    typeof p.status === "string" &&
    (p.infillPercent === undefined || typeof p.infillPercent === "number") &&
    (p.wallThicknessMm === undefined || typeof p.wallThicknessMm === "number") &&
    (p.supportCoefficient === undefined || typeof p.supportCoefficient === "number") &&
    (p.companyId === undefined ||
      p.companyId === null ||
      typeof p.companyId === "string")
  );
}

function validatePricePerGram(value: number): boolean {
  return value > 0 && value <= 50;
}

function validatePrintSettings(
  infillPercent?: number,
  wallThicknessMm?: number,
  supportCoefficient?: number
): string | null {
  if (infillPercent !== undefined && (infillPercent < 0 || infillPercent > 100)) {
    return "Infill must be between 0% and 100%";
  }
  if (wallThicknessMm !== undefined && (wallThicknessMm < 0.4 || wallThicknessMm > 5.0)) {
    return "Wall thickness must be between 0.4mm and 5.0mm";
  }
  if (supportCoefficient !== undefined && (supportCoefficient < 1.0 || supportCoefficient > 2.0)) {
    return "Support coefficient must be between 1.0 and 2.0";
  }
  return null;
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

    if (!STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const printSettingsError = validatePrintSettings(
      body.infillPercent,
      body.wallThicknessMm,
      body.supportCoefficient
    );
    if (printSettingsError) {
      return NextResponse.json({ error: printSettingsError }, { status: 400 });
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
        printerTypes,
        status: body.status,
        ...(body.infillPercent !== undefined && { infillPercent: body.infillPercent }),
        ...(body.wallThicknessMm !== undefined && { wallThicknessMm: body.wallThicknessMm }),
        ...(body.supportCoefficient !== undefined && { supportCoefficient: body.supportCoefficient }),
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
