import type { OrderStatus } from "@prisma/client";

import { OCCASIONAL_INCOME_LIMIT_CZK } from "@/lib/legal/constants";

/** Statuses that count toward maker YTD income for the 50k limit */
export const INCOME_COUNTING_STATUSES: OrderStatus[] = [
  "paid",
  "printing",
  "shipped",
  "delivered",
  "completed",
  "disputed",
];

export function hasValidMakerIco(ico: string | null | undefined): boolean {
  if (!ico) return false;
  const digits = ico.replace(/\s/g, "");
  return /^\d{8}$/.test(digits);
}

/** Normalize IČO input; empty → null */
export function normalizeMakerIco(raw: string | null | undefined): string | null {
  if (raw === undefined || raw === null) return null;
  const digits = raw.replace(/\s/g, "").trim();
  if (digits.length === 0) return null;
  return digits;
}

export function validateMakerIcoInput(raw: string | null | undefined): string | null {
  const normalized = normalizeMakerIco(raw);
  if (normalized === null) return null;
  if (!/^\d{8}$/.test(normalized)) {
    return "IČO must be exactly 8 digits";
  }
  return null;
}

export function calendarYearBounds(date = new Date()): { start: Date; end: Date } {
  const year = date.getFullYear();
  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
    end: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0)),
  };
}

export function wouldExceedOccasionalIncomeLimit(
  ytdPrintCostCzk: number,
  additionalPrintCostCzk: number,
  makerIco: string | null | undefined
): boolean {
  if (hasValidMakerIco(makerIco)) return false;
  return ytdPrintCostCzk + additionalPrintCostCzk > OCCASIONAL_INCOME_LIMIT_CZK;
}

export function remainingOccasionalIncomeCzk(
  ytdPrintCostCzk: number,
  makerIco: string | null | undefined
): number | null {
  if (hasValidMakerIco(makerIco)) return null;
  return Math.max(0, OCCASIONAL_INCOME_LIMIT_CZK - ytdPrintCostCzk);
}
