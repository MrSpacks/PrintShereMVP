import type { OrderStatus } from "@/types/order";

export interface AdminOrderSummary {
  id: string;
  fileName: string;
  status: OrderStatus;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  makerId: string;
  makerName: string;
  customerTotalCzk: number;
  platformFeeCzk: number;
  printCostCzk: number;
  deliveryPriceCzk: number;
  createdAt: string;
  hasDispute: boolean;
  disputeOpen: boolean;
}

export interface AdminStatusBreakdown {
  status: OrderStatus;
  count: number;
  totalCzk: number;
}

export interface AdminStripeStats {
  connected: boolean;
  paymentsCapturedCzk: number;
  pendingPayoutsCzk: number;
  escrowHeldCzk: number;
}

export interface AdminPlatformStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  disputedOrders: number;
  openDisputes: number;
  uniqueCustomers: number;
  makersWithOrders: number;
  ordersLast7Days: number;
  ordersLast30Days: number;
  revenue: {
    /** Paid orders only — excludes cancelled, unpaid, and refunded */
    gmvNetCzk: number;
    gmvCompletedCzk: number;
    gmvInProgressCzk: number;
    /** Platform fee on paid active + completed orders */
    platformFeesNetCzk: number;
    platformFeesCompletedCzk: number;
    makerEarningsCompletedCzk: number;
    refundedToCustomersCzk: number;
    /** Platform fee on refunded orders (not earned) */
    refundedPlatformFeesCzk: number;
    /** Estimated Stripe fees kept on refunded charges */
    stripeRefundFeesCzk: number;
    /** Completed platform fees minus estimated Stripe refund costs */
    netPlatformRevenueCzk: number;
  };
  byStatus: AdminStatusBreakdown[];
  stripe: AdminStripeStats;
}
