import type {
  MakerFilament as PrismaFilament,
  Maker as PrismaMaker,
  MakerPrinter as PrismaPrinter,
} from "@prisma/client";

import type {
  Maker,
  MakerFilament,
  MakerPrinter,
  MakerProfile,
  MakerStatus,
  MakerWorkshopSummary,
  PrinterType,
} from "@/types/maker";

const PRINTER_TYPES = new Set<string>(["fdm", "resin"]);
const MAKER_STATUSES = new Set<string>(["available", "busy", "hidden"]);

function toPrinterTypes(values: string[]): PrinterType[] {
  return values.filter((value): value is PrinterType => PRINTER_TYPES.has(value));
}

function toMakerStatus(status: string): MakerStatus {
  return MAKER_STATUSES.has(status) ? (status as MakerStatus) : "available";
}

export function mapPrinter(record: PrismaPrinter): MakerPrinter {
  return {
    id: record.id,
    technology: record.technology as PrinterType,
    modelKey: record.modelKey,
    modelLabel: record.modelLabel,
    isCustom: record.isCustom,
  };
}

export function mapFilament(record: PrismaFilament): MakerFilament {
  return {
    id: record.id,
    printerType: record.printerType as PrinterType,
    material: record.material,
    color: record.color,
  };
}

export function mapPrismaMaker(
  record: PrismaMaker & {
    filaments?: PrismaFilament[];
    printers?: PrismaPrinter[];
  }
): Maker {
  return {
    id: record.id,
    name: record.name,
    address: record.address,
    latitude: record.latitude,
    longitude: record.longitude,
    rating: record.rating,
    pricePerGramFdmCzk: record.pricePerGramFdmCzk,
    pricePerGramResinCzk: record.pricePerGramResinCzk,
    minOrderPriceCzk: record.minOrderPriceCzk,
    printerTypes: toPrinterTypes(record.printerTypes),
    printers: (record.printers ?? []).map(mapPrinter),
    filaments: (record.filaments ?? []).map(mapFilament),
    status: toMakerStatus(record.status),
  };
}

export function mapPrismaMakerProfile(
  record: PrismaMaker & { filaments: PrismaFilament[]; printers: PrismaPrinter[] }
): MakerProfile {
  return {
    ...mapPrismaMaker(record),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapWorkshopSummary(
  record: Pick<PrismaMaker, "id" | "name" | "status">,
  activeMakerId: string | null
): MakerWorkshopSummary {
  return {
    id: record.id,
    name: record.name,
    status: toMakerStatus(record.status),
    isActive: record.id === activeMakerId,
  };
}

/** Метки для карточки на карте */
export function getFilamentDisplayLabels(filaments: MakerFilament[]): string[] {
  return filaments.map((item) => {
    const prefix = item.printerType === "fdm" ? "FDM" : "Resin";
    return `${prefix} ${item.material} · ${item.color}`;
  });
}

export const getMakerMaterialLabels = (maker: { filaments: MakerFilament[] }) =>
  getFilamentDisplayLabels(maker.filaments);
