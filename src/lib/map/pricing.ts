import {
  getMakerPricePerGramCzk,
  resolvePricingPrinterType,
} from "@/lib/makers/maker-pricing";
import { calculatePrintWeight } from "@/lib/model/geometry-stats";
import {
  DEFAULT_PLA_DENSITY_G_CM3,
  DEFAULT_PRINT_SETTINGS,
  DEFAULT_RESIN_DENSITY_G_CM3,
} from "@/lib/model/constants";
import {
  applyMinOrderFloorCzk,
  calculatePlatformFeeCzk,
} from "@/lib/orders/order-pricing";
import { isPlatformFeeEnabled } from "@/lib/product/product-mode";
import type { Maker, PinPriceDisplay, PrinterType } from "@/types/maker";
import type { PrintSettings } from "@/types/model";

function resolveMakerPrintSettings(
  maker: Pick<Maker, "infillPercent" | "wallThicknessMm" | "supportCoefficient">
): PrintSettings {
  return {
    infillPercent: maker.infillPercent ?? DEFAULT_PRINT_SETTINGS.infillPercent,
    wallThicknessMm:
      maker.wallThicknessMm ?? DEFAULT_PRINT_SETTINGS.wallThicknessMm,
    supportCoefficient:
      maker.supportCoefficient ?? DEFAULT_PRINT_SETTINGS.supportCoefficient,
  };
}

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
  const printSettings = resolveMakerPrintSettings(maker);

  const density =
    printerType === "resin"
      ? DEFAULT_RESIN_DENSITY_G_CM3
      : DEFAULT_PLA_DENSITY_G_CM3;

  return calculatePrintWeight(volumeCm3, density, printSettings);
}

/** Вес модели для прайсинга конкретного мейкера на карте */
export function getMakerQuoteWeightGrams(
  volumeCm3: number,
  maker: Maker,
  printerType: PrinterType
): number | null {
  if (volumeCm3 <= 0) return null;

  const { totalWeight } = recalculateWeightForMaker(
    volumeCm3,
    maker,
    printerType
  );

  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    return null;
  }

  return totalWeight;
}

/** Стоимость печати для карточки мейкера и Total Price (с учётом min. objednávky) */
export function getPrintCostCzk(
  maker: Maker,
  weightGrams: number,
  printerType: PrinterType
): number {
  const raw = Math.round(
    weightGrams * getMakerPricePerGramCzk(maker, printerType)
  );
  return applyMinOrderFloorCzk(raw, maker.minOrderPriceCzk);
}

/** Итоговая цена печати для клиента (maker print + platform fee) */
export function getCustomerQuoteCzk(
  maker: Maker,
  volumeCm3: number | null,
  printerType: PrinterType
): { weightGrams: number | null; customerPrintCzk: number | null } {
  const weightGrams =
    volumeCm3 !== null && volumeCm3 > 0
      ? getMakerQuoteWeightGrams(volumeCm3, maker, printerType)
      : null;

  if (weightGrams === null) {
    return { weightGrams: null, customerPrintCzk: null };
  }

  const makerPrint = getPrintCostCzk(maker, weightGrams, printerType);
  const customerPrintCzk = isPlatformFeeEnabled()
    ? makerPrint + calculatePlatformFeeCzk(makerPrint)
    : makerPrint;
  return {
    weightGrams,
    customerPrintCzk,
  };
}

function formatPrice(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
