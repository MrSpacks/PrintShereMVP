import type { MakerFilament as PrismaFilament, Maker as PrismaMaker } from "@prisma/client";

import type { Maker, MakerFilament, MakerProfile, MakerStatus, PrinterType } from "@/types/maker";

const PRINTER_TYPES = new Set<string>(["fdm", "resin"]);
const MAKER_STATUSES = new Set<string>(["available", "busy"]);

function toPrinterTypes(values: string[]): PrinterType[] {
  return values.filter((value): value is PrinterType => PRINTER_TYPES.has(value));
}

function toMakerStatus(status: string): MakerStatus {
  return MAKER_STATUSES.has(status) ? (status as MakerStatus) : "available";
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
  record: PrismaMaker & { filaments?: PrismaFilament[] }
): Maker {
  return {
    id: record.id,
    name: record.name,
    address: record.address,
    latitude: record.latitude,
    longitude: record.longitude,
    rating: record.rating,
    pricePerGramCzk: record.pricePerGramCzk,
    minOrderPriceCzk: record.minOrderPriceCzk,
    printerTypes: toPrinterTypes(record.printerTypes),
    filaments: (record.filaments ?? []).map(mapFilament),
    status: toMakerStatus(record.status),
  };
}

export function mapPrismaMakerProfile(
  record: PrismaMaker & { filaments: PrismaFilament[] }
): MakerProfile {
  return {
    ...mapPrismaMaker(record),
    updatedAt: record.updatedAt.toISOString(),
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
