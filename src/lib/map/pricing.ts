import {
  getMakerPricePerGramCzk,
  resolvePricingPrinterType,
} from "@/lib/makers/maker-pricing";
import { calculatePrintWeight } from "@/lib/model/geometry-stats";
import {
  DEFAULT_PLA_DENSITY_G_CM3,
  DEFAULT_RESIN_DENSITY_G_CM3,
} from "@/lib/model/constants";
import type { Maker, PinPriceDisplay, PrinterType } from "@/types/maker";
import type { PrintSettings } from "@/types/model";

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

/**
 * Пересчитывает вес модели с учетом настроек печати конкретного мейкера.
 * volumeCm3 - объем модели, printerType - тип принтера (FDM/resin).
 */
export function recalculateWeightForMaker(
  volumeCm3: number,
  maker: Maker,
  printerType: PrinterType
): { totalWeight: number; modelWeight: number; supportWeight: number } {
  const printSettings: PrintSettings = {
    infillPercent: maker.infillPercent,
    wallThicknessMm: maker.wallThicknessMm,
    supportCoefficient: maker.supportCoefficient,
  };
  
  const density = printerType === "resin" 
    ? DEFAULT_RESIN_DENSITY_G_CM3 
    : DEFAULT_PLA_DENSITY_G_CM3;
  
  return calculatePrintWeight(volumeCm3, density, printSettings);
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
