import { describe, expect, it } from "vitest";

import {
  WORKSHOP_UI_STATUSES,
  isWorkshopAcceptingOrders,
  isWorkshopActive,
  normalizeWorkshopUiStatus,
} from "./workshop-status";

describe("workshop-status", () => {
  describe("normalizeWorkshopUiStatus", () => {
    it("available остаётся «работаю»", () => {
      expect(normalizeWorkshopUiStatus("available")).toBe("available");
    });

    it("busy сворачивается в «не работаю»", () => {
      expect(normalizeWorkshopUiStatus("busy")).toBe("hidden");
    });

    it("hidden остаётся «не работаю»", () => {
      expect(normalizeWorkshopUiStatus("hidden")).toBe("hidden");
    });
  });

  describe("isWorkshopActive", () => {
    it("только available считается активной мастерской", () => {
      expect(isWorkshopActive("available")).toBe(true);
      expect(isWorkshopActive("busy")).toBe(false);
      expect(isWorkshopActive("hidden")).toBe(false);
    });
  });

  describe("isWorkshopAcceptingOrders", () => {
    it("заказы принимаются только в статусе available", () => {
      expect(isWorkshopAcceptingOrders("available")).toBe(true);
      expect(isWorkshopAcceptingOrders("busy")).toBe(false);
      expect(isWorkshopAcceptingOrders("hidden")).toBe(false);
    });
  });

  describe("WORKSHOP_UI_STATUSES", () => {
    it("в UI ровно два варианта", () => {
      expect(WORKSHOP_UI_STATUSES).toEqual(["available", "hidden"]);
    });
  });
});
