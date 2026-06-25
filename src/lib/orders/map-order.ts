import type { Order, Maker, User, OrderReview, Dispute, DisputeEvidence } from "@prisma/client";

import { mapDispute } from "@/lib/disputes/map-dispute";
import {
  getCustomerPrintCzk,
  getCustomerTotalCzk,
} from "@/lib/orders/order-pricing";
import type { OrderResponse, OrderStatus, PrintQuality } from "@/types/order";
import type { DeliveryMethod } from "@/types/delivery";

const ORDER_STATUSES = new Set<string>([
  "pending",
  "awaiting_customer",
  "awaiting_payment",
  "paid",
  "printing",
  "shipped",
  "delivered",
  "completed",
  "disputed",
  "refunded",
  "cancelled",
]);
const DELIVERY_METHODS = new Set<string>(["pickup", "zasilkovna"]);
const PRINT_QUALITIES = new Set<string>(["draft", "standard", "high"]);

function toOrderStatus(status: string): OrderStatus {
  return ORDER_STATUSES.has(status) ? (status as OrderStatus) : "pending";
}

function toDeliveryMethod(method: string | null): DeliveryMethod | null {
  if (!method) return null;
  return DELIVERY_METHODS.has(method) ? (method as DeliveryMethod) : null;
}

function toPrintQuality(quality: string): PrintQuality {
  return PRINT_QUALITIES.has(quality) ? (quality as PrintQuality) : "standard";
}

type DisputeWithRelations = Dispute & {
  evidence: DisputeEvidence[];
  openedBy: Pick<User, "name">;
  resolvedBy: Pick<User, "name"> | null;
};

type OrderWithRelations = Order & {
  maker: Maker;
  customer?: User | null;
  review?: OrderReview | null;
  dispute?: DisputeWithRelations | null;
};

export function mapOrder(order: OrderWithRelations): OrderResponse {
  const customerPrintCzk = getCustomerPrintCzk({
    printCostCzk: order.printCostCzk,
    platformFeeCzk: order.platformFeeCzk,
  });

  return {
    id: order.id,
    makerId: order.makerId,
    makerName: order.maker.name,
    customerId: order.customerId,
    customerName: order.customer?.name ?? null,
    fileName: order.fileName,
    fileUrl: order.fileUrl,
    weightGrams: order.weightGrams,
    widthMm: order.widthMm,
    heightMm: order.heightMm,
    depthMm: order.depthMm,
    printCostCzk: order.printCostCzk,
    platformFeeCzk: order.platformFeeCzk,
    customerPrintCzk,
    customerTotalCzk: order.customerTotalCzk || getCustomerTotalCzk(order),
    printQuality: toPrintQuality(order.printQuality),
    deliveryMethod: toDeliveryMethod(order.deliveryMethod),
    deliveryPriceCzk: order.deliveryPriceCzk,
    zasilkovnaPointId: order.zasilkovnaPointId,
    zasilkovnaPointLabel: order.zasilkovnaPointLabel,
    status: toOrderStatus(order.status),
    review: order.review
      ? {
          id: order.review.id,
          rating: order.review.rating,
          comment: order.review.comment,
          createdAt: order.review.createdAt.toISOString(),
        }
      : null,
    dispute: order.dispute ? mapDispute(order.dispute) : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function getOrderTotalCzk(order: OrderResponse): number {
  return order.customerTotalCzk;
}

export const ORDER_DETAIL_INCLUDE = {
  maker: true,
  customer: true,
  review: true,
  dispute: {
    include: {
      evidence: true,
      openedBy: { select: { name: true } },
      resolvedBy: { select: { name: true } },
    },
  },
} as const;
