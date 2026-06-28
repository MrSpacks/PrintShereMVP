import type { OrderStatus } from "@prisma/client";

/** Never captured — exclude from GMV and platform fee totals */
export const NON_REVENUE_STATUSES: OrderStatus[] = [
  "pending",
  "awaiting_customer",
  "awaiting_payment",
  "cancelled",
];

/** Payment received, order not finished — counts toward net GMV */
export const IN_PROGRESS_GMV_STATUSES: OrderStatus[] = [
  "paid",
  "printing",
  "shipped",
  "disputed",
];

/** Settled successfully */
export const COMPLETED_GMV_STATUSES: OrderStatus[] = ["completed", "delivered"];

/** Money returned to customer — tracked separately, excluded from net GMV */
export const REFUNDED_STATUSES: OrderStatus[] = ["refunded"];

export const NET_GMV_STATUSES: OrderStatus[] = [
  ...IN_PROGRESS_GMV_STATUSES,
  ...COMPLETED_GMV_STATUSES,
];
