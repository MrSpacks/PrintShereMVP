/**
 * Estimated Stripe processing fee (EU cards). Stripe keeps this fee on refunds.
 * Override via env when wiring live Stripe reporting.
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

export function estimateStripeProcessingFeeCzk(chargeAmountCzk: number): number {
  if (chargeAmountCzk <= 0) return 0;
  return Math.round(chargeAmountCzk * getStripeFeeRate() + getStripeFeeFixedCzk());
}
