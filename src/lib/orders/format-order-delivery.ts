import type { OrderResponse } from "@/types/order";

type DeliveryOrder = Pick<
  OrderResponse,
  "deliveryMethod" | "deliveryPriceCzk" | "zasilkovnaPointLabel"
>;

type DeliveryLabels = {
  pickup: string;
  delivery: string;
  zasilkovna: string;
};

/** Fulfillment info for makers — includes delivery fee they will receive. */
export function formatMakerDeliveryLabel(
  order: DeliveryOrder,
  labels: DeliveryLabels
): string {
  if (order.deliveryMethod === "delivery") {
    const price = order.deliveryPriceCzk ?? 0;
    return price > 0 ? `${labels.delivery} · ${price} Kč` : labels.delivery;
  }
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
  labels: DeliveryLabels & { czk: string }
): string {
  if (order.deliveryMethod === "delivery") {
    const price = order.deliveryPriceCzk ?? 0;
    return `${labels.delivery} ${price} ${labels.czk}`;
  }
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
