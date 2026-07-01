import type { Maker, PrinterType } from "@/types/maker";

const PRINTER_TYPES = new Set<string>(["fdm", "resin"]);

export function isPrinterType(value: string): value is PrinterType {
  return PRINTER_TYPES.has(value);
}

/** Active technology for pricing when model is loaded (never "all"). */
export function resolvePricingPrinterType(
  printerType: PrinterType | "all"
): PrinterType {
  return printerType === "resin" ? "resin" : "fdm";
}

export function getMakerPricePerGramCzk(
  maker: Pick<Maker, "pricePerGramFdmCzk" | "pricePerGramResinCzk">,
  printerType: PrinterType
): number {
  return printerType === "resin"
    ? maker.pricePerGramResinCzk
    : maker.pricePerGramFdmCzk;
}

export function makerSupportsPrinterType(
  maker: Pick<Maker, "printerTypes">,
  printerType: PrinterType
): boolean {
  return maker.printerTypes.includes(printerType);
}
