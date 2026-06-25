import type { OrderStatus } from "@/types/order";
import type { UserRole } from "@/types/user";

export type OrderAction =
  | "propose_terms"
  | "accept_terms"
  | "pay"
  | "start_printing"
  | "mark_shipped"
  | "confirm_receipt"
  | "cancel";

const CANCELLABLE: OrderStatus[] = [
  "pending",
  "awaiting_customer",
  "awaiting_payment",
  "paid",
];

const ACTION_TRANSITIONS: Record<
  OrderAction,
  { from: OrderStatus[]; to: OrderStatus; roles: UserRole[] }
> = {
  propose_terms: {
    from: ["pending"],
    to: "awaiting_customer",
    roles: ["maker", "admin"],
  },
  accept_terms: {
    from: ["awaiting_customer"],
    to: "awaiting_payment",
    roles: ["customer", "admin"],
  },
  pay: {
    from: ["awaiting_payment"],
    to: "paid",
    roles: ["customer", "admin"],
  },
  start_printing: {
    from: ["paid"],
    to: "printing",
    roles: ["maker", "admin"],
  },
  mark_shipped: {
    from: ["printing"],
    to: "shipped",
    roles: ["maker", "admin"],
  },
  confirm_receipt: {
    from: ["shipped"],
    to: "delivered",
    roles: ["customer", "admin"],
  },
  cancel: {
    from: CANCELLABLE,
    to: "cancelled",
    roles: ["customer", "maker", "admin"],
  },
};

export function canPerformOrderAction(
  status: OrderStatus,
  action: OrderAction,
  role: UserRole
): boolean {
  const rule = ACTION_TRANSITIONS[action];
  if (!rule.roles.includes(role)) return false;
  return rule.from.includes(status);
}

export function getNextStatusForAction(action: OrderAction): OrderStatus {
  return ACTION_TRANSITIONS[action].to;
}

export function canEditOrderTerms(status: OrderStatus): boolean {
  return status === "pending" || status === "awaiting_customer";
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return (
    status !== "cancelled" &&
    status !== "completed" &&
    status !== "refunded"
  );
}

export function isMakerInboxStatus(status: OrderStatus): boolean {
  return (
    status === "pending" ||
    status === "awaiting_customer" ||
    status === "paid" ||
    status === "printing"
  );
}

export function canOpenDispute(status: OrderStatus): boolean {
  return status === "shipped" || status === "delivered" || status === "completed";
}

export function canConfirmReceipt(status: OrderStatus): boolean {
  return status === "shipped";
}

export function canSubmitReview(status: OrderStatus): boolean {
  return status === "delivered";
}
