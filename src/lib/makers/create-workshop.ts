import { randomUUID } from "crypto";

import { MakerStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { geocodeAddress } from "@/lib/geocoding/nominatim";
import { DEFAULT_NEW_MAKER_RATING } from "@/lib/makers/capabilities";
import { derivePrinterTypes } from "@/lib/makers/printer-catalog";
import {
  buildPrinterCreateRows,
  type WorkshopPrinterInput,
} from "@/lib/makers/validate-printers";
import type { PrinterType } from "@/types/maker";

type Tx = Prisma.TransactionClient;

interface CreateWorkshopInput {
  ownerUserId: string;
  workshopName: string;
  address: string;
  printers: WorkshopPrinterInput[];
  setAsActive?: boolean;
}

export async function createWorkshopForUser(
  tx: Tx,
  input: CreateWorkshopInput
) {
  console.log("[createWorkshopForUser] Starting:", {
    workshopName: input.workshopName,
    address: input.address,
    ownerUserId: input.ownerUserId,
  });

  const location = await geocodeAddress(input.address);
  if (!location) {
    console.error("[createWorkshopForUser] Geocoding failed");
    throw new Error("GEOCODE_FAILED");
  }

  console.log("[createWorkshopForUser] Location found:", location);

  const makerId = `maker-${randomUUID()}`;
  const printerRows = buildPrinterCreateRows(makerId, input.printers);
  const printerTypes = derivePrinterTypes(printerRows) as PrinterType[];

  console.log("[createWorkshopForUser] Creating maker:", {
    makerId,
    printerTypes,
    printerCount: printerRows.length,
  });

  const maker = await tx.maker.create({
    data: {
      id: makerId,
      ownerUserId: input.ownerUserId,
      name: input.workshopName.trim(),
      address: location.displayName,
      latitude: location.latitude,
      longitude: location.longitude,
      rating: DEFAULT_NEW_MAKER_RATING,
      pricePerGramFdmCzk: 5,
      pricePerGramResinCzk: printerTypes.includes("resin") ? 12 : 12,
      minOrderPriceCzk: 0,
      printerTypes,
      status: MakerStatus.available,
      printers: { create: printerRows },
    },
    include: {
      filaments: true,
      printers: true,
    },
  });

  console.log("[createWorkshopForUser] Maker created, updating user...");

  if (input.setAsActive !== false) {
    await tx.user.update({
      where: { id: input.ownerUserId },
      data: { makerId },
    });
  }

  console.log("[createWorkshopForUser] Success!");
  return maker;
}
