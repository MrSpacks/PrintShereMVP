import { describe, expect, it } from "vitest";

import { APP_PAGE_WIDTH_CLASS, getAppPageWidthClass } from "./page-width";

describe("page-width", () => {
  describe("getAppPageWidthClass", () => {
    it("по умолчанию возвращает ширину xl", () => {
      expect(getAppPageWidthClass()).toBe("max-w-5xl");
    });

    it("возвращает класс для каждого пресета", () => {
      expect(getAppPageWidthClass("md")).toBe(APP_PAGE_WIDTH_CLASS.md);
      expect(getAppPageWidthClass("lg")).toBe(APP_PAGE_WIDTH_CLASS.lg);
      expect(getAppPageWidthClass("xl")).toBe(APP_PAGE_WIDTH_CLASS.xl);
      expect(getAppPageWidthClass("2xl")).toBe(APP_PAGE_WIDTH_CLASS["2xl"]);
    });
  });
});
