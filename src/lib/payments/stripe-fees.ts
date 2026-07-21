/**
 * Estimated Stripe processing fee (EU cards default).
 * Override via env when wiring live Stripe reporting.
 *
 * Customer pays this fee (gross-up). Maker receives print + delivery in full.
 */
const DEFAULT_RATE = 0.014;
const DEFAULT_FIXED_CZK = 2;

function getStripeFeeRate(): number {
  const raw = process.env.STRIPE_FEE_RATE;
  if (!raw) return DEFAULT_RATE;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_RATE;
}

function getStripeFeeFixedCzk(): number {
  const raw = process.env.STRIPE_FEE_FIXED_CZK;
  if (!raw) return DEFAULT_FIXED_CZK;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_FIXED_CZK;
}

/** Stripe fee for a given charge amount (CZK). */
export function estimateStripeProcessingFeeCzk(chargeAmountCzk: number): number {
  if (chargeAmountCzk <= 0) return 0;
  return Math.round(
    chargeAmountCzk * getStripeFeeRate() + getStripeFeeFixedCzk()
  );
}

/**
 * Gross-up so after Stripe fee, `netBeforeStripeCzk` remains for maker + platform.
 * Returns the amount the customer must pay and the reserved Stripe portion.
 */
export function calculateCustomerChargeWithStripeFeeCzk(
  netBeforeStripeCzk: number
): { customerTotalCzk: number; stripeFeeCzk: number } {
  if (netBeforeStripeCzk <= 0) {
    return { customerTotalCzk: 0, stripeFeeCzk: 0 };
  }

  const rate = getStripeFeeRate();
  const fixed = getStripeFeeFixedCzk();

  if (rate >= 1) {
    throw new Error("Invalid STRIPE_FEE_RATE");
  }

  let customerTotalCzk = Math.ceil((netBeforeStripeCzk + fixed) / (1 - rate));

  // Guard against rounding so net after estimated fee never drops below target
  while (
    customerTotalCzk - estimateStripeProcessingFeeCzk(customerTotalCzk) <
    netBeforeStripeCzk
  ) {
    customerTotalCzk += 1;
  }

  return {
    customerTotalCzk,
    stripeFeeCzk: customerTotalCzk - netBeforeStripeCzk,
  };
}
