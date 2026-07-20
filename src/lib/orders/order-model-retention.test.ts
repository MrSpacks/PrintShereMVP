import { describe, expect, it } from "vitest";

import {
  MODEL_RETENTION_DAYS,
  computeModelRetainUntil,
  isModelFileAvailable,
  shouldScheduleModelRetention,
  shouldShowModelRetentionNotice,
} from "./order-model-retention";

describe("order-model-retention", () => {
  describe("computeModelRetainUntil", () => {
    it("добавляет 30 дней к дате завершения", () => {
      const from = new Date("2026-01-01T12:00:00.000Z");
      const until = computeModelRetainUntil(from);
      expect(until.toISOString()).toBe("2026-01-31T12:00:00.000Z");
    });

    it("константа срока хранения — 30 дней", () => {
      expect(MODEL_RETENTION_DAYS).toBe(30);
    });
  });

  describe("shouldScheduleModelRetention", () => {
    it("планирует удаление после доставки, завершения и возврата", () => {
      expect(shouldScheduleModelRetention("delivered")).toBe(true);
      expect(shouldScheduleModelRetention("completed")).toBe(true);
      expect(shouldScheduleModelRetention("refunded")).toBe(true);
    });

    it("не планирует во время печати и доставки", () => {
      expect(shouldScheduleModelRetention("printing")).toBe(false);
      expect(shouldScheduleModelRetention("shipped")).toBe(false);
      expect(shouldScheduleModelRetention("paid")).toBe(false);
    });
  });

  describe("isModelFileAvailable", () => {
    it("файл недоступен после удаления", () => {
      expect(
        isModelFileAvailable({
          fileUrl: null,
          fileDeletedAt: new Date(),
          modelRetainUntil: null,
        })
      ).toBe(false);
    });

    it("файл доступен до modelRetainUntil", () => {
      const future = new Date(Date.now() + 86_400_000);
      expect(
        isModelFileAvailable({
          fileUrl: "/api/orders/x/file",
          fileDeletedAt: null,
          modelRetainUntil: future,
        })
      ).toBe(true);
    });

    it("файл недоступен после истечения срока", () => {
      const past = new Date(Date.now() - 86_400_000);
      expect(
        isModelFileAvailable({
          fileUrl: "/api/orders/x/file",
          fileDeletedAt: null,
          modelRetainUntil: past,
        })
      ).toBe(false);
    });
  });

  describe("shouldShowModelRetentionNotice", () => {
    it("показывает уведомление, когда задан срок удаления", () => {
      expect(
        shouldShowModelRetentionNotice({
          fileUrl: "/api/orders/x/file",
          fileDeletedAt: null,
          modelRetainUntil: new Date("2026-02-01T00:00:00.000Z"),
        })
      ).toBe(true);
    });
  });
});
