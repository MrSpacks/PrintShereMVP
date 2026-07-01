import type { DeliveryMethod } from "@/types/delivery";
import type { PrinterType } from "@/types/maker";

import { getMakerPricePerGramCzk } from "@/lib/makers/maker-pricing";

const PLATFORM_FEE_RATE = 0.12;
const PLATFORM_FEE_MIN_CZK = 30;

export function calculateMakerPrintCzk(
  pricePerGramCzk: number,
  weightGrams: number
): number {
  return Math.round(weightGrams * pricePerGramCzk);
}

export function calculatePlatformFeeCzk(makerPrintCzk: number): number {
  return Math.max(
    PLATFORM_FEE_MIN_CZK,
    Math.round(makerPrintCzk * PLATFORM_FEE_RATE)
  );
}

async function calculateDeliveryPriceCzk(
  makerId: string,
  weightGrams: number,
  deliveryMethod: DeliveryMethod
): Promise<number> {
  if (deliveryMethod !== "zasilkovna") return 0;

  const { getZasilkovnaQuote } = await import("@/lib/delivery/zasilkovna");
  const quote = await getZasilkovnaQuote({ makerId, weightGrams });
  return quote.priceCzk;
}

export interface OrderPricing {
  printCostCzk: number;
  platformFeeCzk: number;
  deliveryPriceCzk: number;
  customerTotalCzk: number;
}

export async function calculateOrderPricing(
  maker: {
    id: string;
    pricePerGramFdmCzk: number;
    pricePerGramResinCzk: number;
  },
  weightGrams: number,
  deliveryMethod: DeliveryMethod,
  printerType: PrinterType
): Promise<OrderPricing> {
  const pricePerGram = getMakerPricePerGramCzk(maker, printerType);
  const printCostCzk = calculateMakerPrintCzk(pricePerGram, weightGrams);
  const platformFeeCzk = calculatePlatformFeeCzk(printCostCzk);
  const deliveryPriceCzk = await calculateDeliveryPriceCzk(
    maker.id,
    weightGrams,
    deliveryMethod
  );

  return {
    printCostCzk,
    platformFeeCzk,
    deliveryPriceCzk,
    customerTotalCzk: printCostCzk + platformFeeCzk + deliveryPriceCzk,
  };
}

/** Cena tisku zobrazená zákazníkovi (včetně skryté provize) */
export function getCustomerPrintCzk(order: {
  printCostCzk: number;
  platformFeeCzk: number;
}): number {
  return order.printCostCzk + order.platformFeeCzk;
}

export function getCustomerTotalCzk(order: {
  printCostCzk: number;
  platformFeeCzk: number;
  deliveryPriceCzk: number;
  customerTotalCzk?: number;
}): number {
  return (
    order.customerTotalCzk ??
    order.printCostCzk + order.platformFeeCzk + order.deliveryPriceCzk
  );
}
