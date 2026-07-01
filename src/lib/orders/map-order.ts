import type { Order, Maker, User, OrderReview, Dispute, DisputeEvidence } from "@prisma/client";

import { mapDispute } from "@/lib/disputes/map-dispute";
import {
  getCustomerPrintCzk,
  getCustomerTotalCzk,
} from "@/lib/orders/order-pricing";
import { toOrderFileDownloadUrl } from "@/lib/orders/order-file-paths";
import type { OrderResponse, OrderStatus, PrintQuality } from "@/types/order";
import type { DeliveryMethod } from "@/types/delivery";
import type { PrinterType } from "@/types/maker";
import type { UserRole } from "@/types/user";

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
const PRINTER_TYPES = new Set<string>(["fdm", "resin"]);

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

function toPrinterType(printerType: string): PrinterType {
  return PRINTER_TYPES.has(printerType) ? (printerType as PrinterType) : "fdm";
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
    fileUrl: order.fileUrl ? toOrderFileDownloadUrl(order.id) : null,
    weightGrams: order.weightGrams,
    widthMm: order.widthMm,
    heightMm: order.heightMm,
    depthMm: order.depthMm,
    printerType: toPrinterType(order.printerType),
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

export function getMakerPayoutCzk(order: Pick<OrderResponse, "printCostCzk">): number {
  return order.printCostCzk;
}

export function getOrderTotalCzk(
  order: OrderResponse,
  viewerRole?: UserRole
): number {
  if (viewerRole === "maker") {
    return getMakerPayoutCzk(order);
  }
  return order.customerTotalCzk ?? order.printCostCzk;
}

export function mapOrderForViewer(
  order: OrderWithRelations,
  viewerRole: UserRole
): OrderResponse {
  const mapped = mapOrder(order);
  if (viewerRole !== "maker") return mapped;

  const {
    platformFeeCzk: _platformFeeCzk,
    customerTotalCzk: _customerTotalCzk,
    customerPrintCzk: _customerPrintCzk,
    deliveryPriceCzk: _deliveryPriceCzk,
    ...makerSafe
  } = mapped;

  return makerSafe;
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
