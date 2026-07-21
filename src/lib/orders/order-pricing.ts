import type { DeliveryMethod } from "@/types/delivery";
import type { PrinterType } from "@/types/maker";

import { getMakerPricePerGramCzk } from "@/lib/makers/maker-pricing";
import { calculateCustomerChargeWithStripeFeeCzk } from "@/lib/payments/stripe-fees";

/** Platform commission on maker print only (not delivery). */
const PLATFORM_FEE_RATE = 0.1;
const PLATFORM_FEE_MIN_CZK = 50;

export function calculateMakerPrintCzk(
  pricePerGramCzk: number,
  weightGrams: number
): number {
  return Math.round(weightGrams * pricePerGramCzk);
}

/** Min. objednávka = spodní limit ceny tisku pro výrobce (ne blokace). */
export function applyMinOrderFloorCzk(
  printCostCzk: number,
  minOrderPriceCzk: number
): number {
  if (minOrderPriceCzk <= 0) return printCostCzk;
  return Math.max(printCostCzk, Math.round(minOrderPriceCzk));
}

export function calculatePlatformFeeCzk(makerPrintCzk: number): number {
  if (makerPrintCzk <= 0) return 0;
  return Math.max(
    PLATFORM_FEE_MIN_CZK,
    Math.round(makerPrintCzk * PLATFORM_FEE_RATE)
  );
}

export function resolveDeliveryPriceCzk(
  maker: { offersDelivery: boolean; deliveryPriceCzk: number },
  deliveryMethod: DeliveryMethod
): number {
  if (deliveryMethod === "pickup") return 0;
  if (deliveryMethod === "delivery" && maker.offersDelivery) {
    return Math.max(0, Math.round(maker.deliveryPriceCzk));
  }
  // Legacy zasilkovna orders keep stored price; new quotes should not use this path
  return 0;
}

export interface OrderMoneyBreakdown {
  printCostCzk: number;
  deliveryPriceCzk: number;
  platformFeeCzk: number;
  stripeFeeCzk: number;
  customerTotalCzk: number;
  /** What the maker should receive: print + delivery */
  makerPayoutCzk: number;
}

/**
 * Full money recalculation from maker print + delivery.
 * Use on order create and whenever the maker changes print cost after chat.
 */
export function recalculateOrderMoney(input: {
  printCostCzk: number;
  deliveryPriceCzk: number;
}): OrderMoneyBreakdown {
  const printCostCzk = Math.max(0, Math.round(input.printCostCzk));
  const deliveryPriceCzk = Math.max(0, Math.round(input.deliveryPriceCzk));
  const platformFeeCzk = calculatePlatformFeeCzk(printCostCzk);
  const netBeforeStripe = printCostCzk + deliveryPriceCzk + platformFeeCzk;
  const { customerTotalCzk, stripeFeeCzk } =
    calculateCustomerChargeWithStripeFeeCzk(netBeforeStripe);

  return {
    printCostCzk,
    deliveryPriceCzk,
    platformFeeCzk,
    stripeFeeCzk,
    customerTotalCzk,
    makerPayoutCzk: printCostCzk + deliveryPriceCzk,
  };
}

export interface OrderPricing {
  printCostCzk: number;
  platformFeeCzk: number;
  deliveryPriceCzk: number;
  stripeFeeCzk: number;
  customerTotalCzk: number;
}

export function calculateOrderPricing(
  maker: {
    id: string;
    pricePerGramFdmCzk: number;
    pricePerGramResinCzk: number;
    minOrderPriceCzk: number;
    offersDelivery: boolean;
    deliveryPriceCzk: number;
  },
  weightGrams: number,
  deliveryMethod: DeliveryMethod,
  printerType: PrinterType
): OrderPricing {
  const pricePerGram = getMakerPricePerGramCzk(maker, printerType);
  const rawPrintCostCzk = calculateMakerPrintCzk(pricePerGram, weightGrams);
  const printCostCzk = applyMinOrderFloorCzk(
    rawPrintCostCzk,
    maker.minOrderPriceCzk
  );
  const deliveryPriceCzk = resolveDeliveryPriceCzk(maker, deliveryMethod);
  const money = recalculateOrderMoney({ printCostCzk, deliveryPriceCzk });

  return {
    printCostCzk: money.printCostCzk,
    platformFeeCzk: money.platformFeeCzk,
    deliveryPriceCzk: money.deliveryPriceCzk,
    stripeFeeCzk: money.stripeFeeCzk,
    customerTotalCzk: money.customerTotalCzk,
  };
}

/** Cena tisku zobrazená zákazníkovi (včetně skryté provize platformy, bez Stripe) */
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
  stripeFeeCzk?: number;
  customerTotalCzk?: number;
}): number {
  if (order.customerTotalCzk && order.customerTotalCzk > 0) {
    return order.customerTotalCzk;
  }

  const money = recalculateOrderMoney({
    printCostCzk: order.printCostCzk,
    deliveryPriceCzk: order.deliveryPriceCzk,
  });
  return money.customerTotalCzk;
}
