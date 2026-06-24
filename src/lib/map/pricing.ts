import type { Maker, PinPriceDisplay } from "@/types/maker";

/**
 * Форматирует цену на пине карты.
 * Без модели — цена за грамм; с моделью — итог печати (вес × CZK/g).
 */
export function getPinPriceDisplay(
  maker: Maker,
  weightGrams: number | null
): PinPriceDisplay {
  if (weightGrams === null || weightGrams <= 0) {
    return {
      label: `${formatPrice(maker.pricePerGramCzk)} CZK/g`,
      printCostCzk: null,
      weightGrams: null,
    };
  }

  const printCostCzk = Math.round(weightGrams * maker.pricePerGramCzk);
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
  weightGrams: number
): number {
  return Math.round(weightGrams * maker.pricePerGramCzk);
}

function formatPrice(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
