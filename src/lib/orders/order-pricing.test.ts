import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("order-pricing — connection mode", () => {
  const env = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_PLATFORM_FEE_ENABLED;
    delete process.env.NEXT_PUBLIC_STRIPE_FEE_IN_QUOTE;
  });

  afterEach(() => {
    process.env = env;
  });

  it("bez provize a Stripe — total = tisk + doprava", async () => {
    const { recalculateOrderMoney, getCustomerTotalCzk } = await import(
      "./order-pricing"
    );

    const money = recalculateOrderMoney({
      printCostCzk: 200,
      deliveryPriceCzk: 79,
    });

    expect(money.platformFeeCzk).toBe(0);
    expect(money.stripeFeeCzk).toBe(0);
    expect(money.customerTotalCzk).toBe(279);
    expect(money.makerPayoutCzk).toBe(279);

    expect(
      getCustomerTotalCzk({
        printCostCzk: 200,
        platformFeeCzk: 0,
        deliveryPriceCzk: 79,
      })
    ).toBe(279);
  });

  it("s provizí platformy přičte fee k total", async () => {
    process.env.NEXT_PUBLIC_PLATFORM_FEE_ENABLED = "true";
    const { recalculateOrderMoney } = await import("./order-pricing");

    const money = recalculateOrderMoney({
      printCostCzk: 200,
      deliveryPriceCzk: 0,
    });

    expect(money.platformFeeCzk).toBe(50);
    expect(money.customerTotalCzk).toBe(250);
  });
});
