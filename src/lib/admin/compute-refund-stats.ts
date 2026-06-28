import { estimateStripeProcessingFeeCzk } from "@/lib/payments/stripe-fees";

export interface RefundOrderRow {
  customerTotalCzk: number;
  platformFeeCzk: number;
  dispute: { refundAmountCzk: number | null } | null;
}

export interface RefundStats {
  refundedToCustomersCzk: number;
  refundedPlatformFeesCzk: number;
  stripeRefundFeesCzk: number;
}

export function computeRefundStats(orders: RefundOrderRow[]): RefundStats {
  let refundedToCustomersCzk = 0;
  let refundedPlatformFeesCzk = 0;
  let stripeRefundFeesCzk = 0;

  for (const order of orders) {
    const refundToCustomer =
      order.dispute?.refundAmountCzk ?? order.customerTotalCzk;
    refundedToCustomersCzk += refundToCustomer;
    refundedPlatformFeesCzk += order.platformFeeCzk;
    stripeRefundFeesCzk += estimateStripeProcessingFeeCzk(
      order.customerTotalCzk
    );
  }

  return {
    refundedToCustomersCzk,
    refundedPlatformFeesCzk,
    stripeRefundFeesCzk,
  };
}
