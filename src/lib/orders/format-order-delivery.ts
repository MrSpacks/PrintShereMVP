import type { OrderResponse } from "@/types/order";

type DeliveryOrder = Pick<
  OrderResponse,
  "deliveryMethod" | "deliveryPriceCzk" | "zasilkovnaPointLabel"
>;

/** Fulfillment info for makers — no shipping price (customer pays delivery). */
export function formatMakerDeliveryLabel(
  order: DeliveryOrder,
  labels: { pickup: string; zasilkovna: string }
): string {
  if (order.deliveryMethod === "zasilkovna") {
    if (order.zasilkovnaPointLabel) {
      return `${labels.zasilkovna} — ${order.zasilkovnaPointLabel}`;
    }
    return labels.zasilkovna;
  }
  return labels.pickup;
}

/** Customer-facing delivery line — includes shipping price when applicable. */
export function formatCustomerDeliveryLabel(
  order: DeliveryOrder,
  labels: { pickup: string; zasilkovna: string; czk: string }
): string {
  if (order.deliveryMethod === "zasilkovna") {
    const price = order.deliveryPriceCzk ?? 0;
    const base = `${labels.zasilkovna} ${price} ${labels.czk}`;
    if (order.zasilkovnaPointLabel) {
      return `${base} — ${order.zasilkovnaPointLabel}`;
    }
    return base;
  }
  return labels.pickup;
}
