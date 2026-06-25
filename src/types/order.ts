import type { DeliveryMethod } from "@/types/delivery";
import type { DisputeSummary } from "@/types/dispute";
import type { OrderReviewSummary } from "@/types/review";

export type OrderStatus =
  | "pending"
  | "awaiting_customer"
  | "awaiting_payment"
  | "paid"
  | "printing"
  | "shipped"
  | "delivered"
  | "completed"
  | "disputed"
  | "refunded"
  | "cancelled";

export type PrintQuality = "draft" | "standard" | "high";

export type OrderAction =
  | "propose_terms"
  | "accept_terms"
  | "pay"
  | "start_printing"
  | "mark_shipped"
  | "confirm_receipt"
  | "cancel";

export interface CreateOrderPayload {
  makerId: string;
  fileName: string;
  weightGrams: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  deliveryMethod: DeliveryMethod;
  zasilkovnaPointId?: string;
  zasilkovnaPointLabel?: string;
}

export interface OrderResponse {
  id: string;
  makerId: string;
  makerName: string;
  customerId: string | null;
  customerName: string | null;
  fileName: string;
  fileUrl: string | null;
  weightGrams: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  printCostCzk: number;
  platformFeeCzk: number;
  customerPrintCzk: number;
  customerTotalCzk: number;
  printQuality: PrintQuality;
  deliveryMethod: DeliveryMethod | null;
  deliveryPriceCzk: number;
  zasilkovnaPointId: string | null;
  zasilkovnaPointLabel: string | null;
  status: OrderStatus;
  review: OrderReviewSummary | null;
  dispute: DisputeSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderPayload {
  weightGrams?: number;
  printCostCzk?: number;
  printQuality?: PrintQuality;
  action?: OrderAction;
}

export interface OrderMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: "customer" | "maker" | "admin" | "moderator";
  body: string;
  createdAt: string;
  isOwn: boolean;
}

export interface SendMessagePayload {
  body: string;
}
