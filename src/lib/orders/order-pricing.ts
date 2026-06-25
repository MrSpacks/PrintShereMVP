import { getZasilkovnaQuote } from "@/lib/delivery/zasilkovna";
import type { DeliveryMethod } from "@/types/delivery";

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

export async function calculateDeliveryPriceCzk(
  makerId: string,
  weightGrams: number,
  deliveryMethod: DeliveryMethod
): Promise<number> {
  if (deliveryMethod === "pickup") return 0;

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
  maker: { id: string; pricePerGramCzk: number },
  weightGrams: number,
  deliveryMethod: DeliveryMethod
): Promise<OrderPricing> {
  const printCostCzk = calculateMakerPrintCzk(
    maker.pricePerGramCzk,
    weightGrams
  );
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
}): number {
  return (
    order.printCostCzk + order.platformFeeCzk + order.deliveryPriceCzk
  );
}
