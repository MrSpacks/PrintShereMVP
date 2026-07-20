import type { Maker, PrinterType } from "@/types/maker";

const PRINTER_TYPES = new Set<string>(["fdm", "resin"]);

export function isPrinterType(value: string): value is PrinterType {
  return PRINTER_TYPES.has(value);
}

/** Технология для расчёта цены на карте, когда выбран фильтр «все». */
export function resolvePricingPrinterType(
  printerType: PrinterType | "all"
): PrinterType {
  return printerType === "resin" ? "resin" : "fdm";
}

export function getMakerPricePerGramCzk(
  maker: Pick<Maker, "pricePerGramFdmCzk" | "pricePerGramResinCzk">,
  printerType: PrinterType
): number {
  // У каждой технологии своя цена за грамм (Stage 1 pricing)
  return printerType === "resin"
    ? maker.pricePerGramResinCzk
    : maker.pricePerGramFdmCzk;
}

/** Есть ли у мастерской выбранный тип принтера (для фильтра на карте). */
export function makerSupportsPrinterType(
  maker: Pick<Maker, "printerTypes">,
  printerType: PrinterType
): boolean {
  return maker.printerTypes.includes(printerType);
}
