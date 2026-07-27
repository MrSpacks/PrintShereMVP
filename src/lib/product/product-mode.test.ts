import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("product-mode", () => {
  const env = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_PAYMENTS_ENABLED;
    delete process.env.NEXT_PUBLIC_PLATFORM_FEE_ENABLED;
  });

  afterEach(() => {
    process.env = env;
  });

  it("по умолчанию connection mode без платежей и комиссии", async () => {
    const mod = await import("./product-mode");
    expect(mod.isPaymentsEnabled()).toBe(false);
    expect(mod.isConnectionMode()).toBe(true);
    expect(mod.isPlatformFeeEnabled()).toBe(false);
    expect(mod.acceptTermsSkipsPayment()).toBe(true);
  });

  it("включает marketplace mode через env", async () => {
    process.env.NEXT_PUBLIC_PAYMENTS_ENABLED = "true";
    process.env.NEXT_PUBLIC_PLATFORM_FEE_ENABLED = "true";
    const mod = await import("./product-mode");
    expect(mod.isPaymentsEnabled()).toBe(true);
    expect(mod.isConnectionMode()).toBe(false);
    expect(mod.isPlatformFeeEnabled()).toBe(true);
    expect(mod.acceptTermsSkipsPayment()).toBe(false);
  });
});
