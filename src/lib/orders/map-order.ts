import type { Order, Maker } from "@prisma/client";

import type { OrderResponse, OrderStatus } from "@/types/order";
import type { DeliveryMethod } from "@/types/delivery";

const ORDER_STATUSES = new Set<string>(["pending", "confirmed", "cancelled"]);
const DELIVERY_METHODS = new Set<string>(["pickup", "zasilkovna"]);

function toOrderStatus(status: string): OrderStatus {
  return ORDER_STATUSES.has(status) ? (status as OrderStatus) : "pending";
}

function toDeliveryMethod(method: string | null): DeliveryMethod | null {
  if (!method) return null;
  return DELIVERY_METHODS.has(method) ? (method as DeliveryMethod) : null;
}

export function mapOrder(order: Order & { maker: Maker }): OrderResponse {
  return {
    id: order.id,
    makerId: order.makerId,
    makerName: order.maker.name,
    fileName: order.fileName,
    weightGrams: order.weightGrams,
    widthMm: order.widthMm,
    heightMm: order.heightMm,
    depthMm: order.depthMm,
    printCostCzk: order.printCostCzk,
    deliveryMethod: toDeliveryMethod(order.deliveryMethod),
    deliveryPriceCzk: order.deliveryPriceCzk,
    zasilkovnaPointId: order.zasilkovnaPointId,
    status: toOrderStatus(order.status),
    createdAt: order.createdAt.toISOString(),
  };
}

export function getOrderTotalCzk(order: OrderResponse): number {
  return order.printCostCzk + order.deliveryPriceCzk;
}
