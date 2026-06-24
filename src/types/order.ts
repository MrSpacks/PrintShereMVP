import type { DeliveryMethod } from "@/types/delivery";

export type OrderStatus = "pending" | "confirmed" | "cancelled";

export interface CreateOrderPayload {
  makerId: string;
  fileName: string;
  weightGrams: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  printCostCzk: number;
  deliveryMethod: DeliveryMethod;
  deliveryPriceCzk: number;
  zasilkovnaPointId?: string;
}

export interface OrderResponse {
  id: string;
  makerId: string;
  makerName: string;
  fileName: string;
  weightGrams: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  printCostCzk: number;
  deliveryMethod: DeliveryMethod | null;
  deliveryPriceCzk: number;
  zasilkovnaPointId: string | null;
  status: OrderStatus;
  createdAt: string;
}
