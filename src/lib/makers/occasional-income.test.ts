import { describe, expect, it } from "vitest";

import {
  hasValidMakerIco,
  normalizeMakerIco,
  remainingOccasionalIncomeCzk,
  wouldExceedOccasionalIncomeLimit,
} from "@/lib/makers/occasional-income";

describe("occasional income gate", () => {
  it("accepts 8-digit IČO", () => {
    expect(hasValidMakerIco("19618492")).toBe(true);
    expect(hasValidMakerIco("123")).toBe(false);
    expect(normalizeMakerIco(" 1961 8492 ")).toBe("19618492");
  });

  it("skips limit when IČO is set", () => {
    expect(wouldExceedOccasionalIncomeLimit(49000, 2000, "19618492")).toBe(
      false
    );
    expect(remainingOccasionalIncomeCzk(10000, "19618492")).toBeNull();
  });

  it("enforces 50k without IČO", () => {
    expect(wouldExceedOccasionalIncomeLimit(49000, 2000, null)).toBe(true);
    expect(wouldExceedOccasionalIncomeLimit(48000, 2000, null)).toBe(false);
    expect(remainingOccasionalIncomeCzk(12000, null)).toBe(38000);
  });
});
