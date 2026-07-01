import {
  getMakerPricePerGramCzk,
  resolvePricingPrinterType,
} from "@/lib/makers/maker-pricing";
import type { Maker, PinPriceDisplay, PrinterType } from "@/types/maker";

/**
 * Форматирует цену на пине карты.
 * Без модели — цена за грамм; с моделью — итог печати (вес × CZK/g).
 */
export function getPinPriceDisplay(
  maker: Maker,
  weightGrams: number | null,
  printerType: PrinterType | "all" = "fdm"
): PinPriceDisplay {
  const activeType = resolvePricingPrinterType(printerType);
  const pricePerGram = getMakerPricePerGramCzk(maker, activeType);

  if (weightGrams === null || weightGrams <= 0) {
    return {
      label: `${formatPrice(pricePerGram)} CZK/g`,
      printCostCzk: null,
      weightGrams: null,
    };
  }

  const printCostCzk = getPrintCostCzk(maker, weightGrams, activeType);
  const roundedWeight = Math.round(weightGrams * 10) / 10;

  return {
    label: `${printCostCzk} CZK (${roundedWeight}g)`,
    printCostCzk,
    weightGrams: roundedWeight,
  };
}

/** Стоимость печати для карточки мейкера и Total Price */
export function getPrintCostCzk(
  maker: Maker,
  weightGrams: number,
  printerType: PrinterType
): number {
  return Math.round(
    weightGrams * getMakerPricePerGramCzk(maker, printerType)
  );
}

function formatPrice(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
