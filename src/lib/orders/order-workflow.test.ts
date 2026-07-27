import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("order-workflow — отмена заказа", () => {
  const env = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_PAYMENTS_ENABLED;
  });

  afterEach(() => {
    process.env = env;
  });

  it("клиент может отменить до оплаты (marketplace mode)", async () => {
    process.env.NEXT_PUBLIC_PAYMENTS_ENABLED = "true";
    const { canCancelOrder, canPerformOrderAction } = await import(
      "./order-workflow"
    );

    expect(canCancelOrder("pending", "customer")).toBe(true);
    expect(canCancelOrder("awaiting_customer", "customer")).toBe(true);
    expect(canCancelOrder("awaiting_payment", "customer")).toBe(true);
    expect(canCancelOrder("paid", "customer")).toBe(false);
    expect(canPerformOrderAction("paid", "cancel", "maker")).toBe(false);
  });

  it("connection mode: отмена до start_printing включая paid", async () => {
    const { canCancelOrder, canPerformOrderAction, getNextStatusForAction } =
      await import("./order-workflow");

    expect(canCancelOrder("paid", "customer")).toBe(true);
    expect(canCancelOrder("printing", "customer")).toBe(false);
    expect(canPerformOrderAction("paid", "cancel", "maker")).toBe(true);
    expect(getNextStatusForAction("accept_terms")).toBe("paid");
  });

  it("pay недоступен без платежей", async () => {
    const { canPerformOrderAction } = await import("./order-workflow");

    expect(
      canPerformOrderAction("awaiting_payment", "pay", "customer")
    ).toBe(false);
  });
});
