import { describe, expect, it } from "vitest";

import { canCancelOrder, canPerformOrderAction } from "./order-workflow";

describe("order-workflow — отмена заказа", () => {
  it("клиент может отменить до оплаты", () => {
    expect(canCancelOrder("pending", "customer")).toBe(true);
    expect(canCancelOrder("awaiting_customer", "customer")).toBe(true);
    expect(canCancelOrder("awaiting_payment", "customer")).toBe(true);
  });

  it("нельзя отменить после оплаты или принятия в работу", () => {
    expect(canCancelOrder("paid", "customer")).toBe(false);
    expect(canCancelOrder("printing", "customer")).toBe(false);
    expect(canCancelOrder("shipped", "maker")).toBe(false);
    expect(canCancelOrder("completed", "admin")).toBe(false);
  });

  it("мейкер может отменить только до оплаты", () => {
    expect(canCancelOrder("pending", "maker")).toBe(true);
    expect(canCancelOrder("paid", "maker")).toBe(false);
  });

  it("canPerformOrderAction делегирует cancel в canCancelOrder", () => {
    expect(canPerformOrderAction("awaiting_payment", "cancel", "customer")).toBe(
      true
    );
    expect(canPerformOrderAction("paid", "cancel", "maker")).toBe(false);
  });
});
