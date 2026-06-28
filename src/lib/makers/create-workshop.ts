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
  const location = await geocodeAddress(input.address);
  if (!location) {
    throw new Error("GEOCODE_FAILED");
  }

  const makerId = `maker-${randomUUID()}`;
  const printerRows = buildPrinterCreateRows(makerId, input.printers);
  const printerTypes = derivePrinterTypes(printerRows) as PrinterType[];

  const maker = await tx.maker.create({
    data: {
      id: makerId,
      ownerUserId: input.ownerUserId,
      name: input.workshopName.trim(),
      address: location.displayName,
      latitude: location.latitude,
      longitude: location.longitude,
      rating: DEFAULT_NEW_MAKER_RATING,
      pricePerGramCzk: 5,
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

  if (input.setAsActive !== false) {
    await tx.user.update({
      where: { id: input.ownerUserId },
      data: { makerId },
    });
  }

  return maker;
}
