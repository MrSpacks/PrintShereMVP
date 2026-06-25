import type { OrderStatus } from "@/types/order";

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  awaiting_customer: "bg-sky-50 text-sky-700",
  awaiting_payment: "bg-violet-50 text-violet-700",
  paid: "bg-emerald-50 text-emerald-700",
  printing: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-teal-50 text-teal-700",
  completed: "bg-zinc-100 text-zinc-700",
  disputed: "bg-red-50 text-red-700",
  refunded: "bg-orange-50 text-orange-700",
  cancelled: "bg-zinc-100 text-zinc-600",
};

export const ORDER_STATUS_KEYS: Record<OrderStatus, string> = {
  pending: "orders.statusPending",
  awaiting_customer: "orders.statusAwaitingCustomer",
  awaiting_payment: "orders.statusAwaitingPayment",
  paid: "orders.statusPaid",
  printing: "orders.statusPrinting",
  shipped: "orders.statusShipped",
  delivered: "orders.statusDelivered",
  completed: "orders.statusCompleted",
  disputed: "orders.statusDisputed",
  refunded: "orders.statusRefunded",
  cancelled: "orders.statusCancelled",
};
