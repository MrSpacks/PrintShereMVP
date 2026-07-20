import { describe, expect, it } from "vitest";

import {
  getMakerPricePerGramCzk,
  isPrinterType,
  makerSupportsPrinterType,
  resolvePricingPrinterType,
} from "./maker-pricing";

const maker = {
  pricePerGramFdmCzk: 5,
  pricePerGramResinCzk: 12,
  printerTypes: ["fdm", "resin"] as const,
};

describe("maker-pricing", () => {
  describe("resolvePricingPrinterType", () => {
    it("фильтр «все» даёт FDM для расчёта цены", () => {
      expect(resolvePricingPrinterType("all")).toBe("fdm");
    });

    it("resin сохраняется для SLA", () => {
      expect(resolvePricingPrinterType("resin")).toBe("resin");
    });
  });

  describe("getMakerPricePerGramCzk", () => {
    it("берёт цену FDM или resin в зависимости от технологии", () => {
      expect(getMakerPricePerGramCzk(maker, "fdm")).toBe(5);
      expect(getMakerPricePerGramCzk(maker, "resin")).toBe(12);
    });
  });

  describe("makerSupportsPrinterType", () => {
    it("проверяет наличие технологии у мастерской", () => {
      expect(makerSupportsPrinterType(maker, "fdm")).toBe(true);
      expect(makerSupportsPrinterType(maker, "resin")).toBe(true);
      expect(
        makerSupportsPrinterType({ printerTypes: ["fdm"] }, "resin")
      ).toBe(false);
    });
  });

  describe("isPrinterType", () => {
    it("принимает только fdm и resin", () => {
      expect(isPrinterType("fdm")).toBe(true);
      expect(isPrinterType("resin")).toBe(true);
      expect(isPrinterType("sla")).toBe(false);
    });
  });
});
