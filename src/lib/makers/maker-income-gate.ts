import { prisma } from "@/lib/prisma";
import {
  calendarYearBounds,
  INCOME_COUNTING_STATUSES,
  remainingOccasionalIncomeCzk,
  wouldExceedOccasionalIncomeLimit,
} from "@/lib/makers/occasional-income";

export async function getMakerYearToDatePrintIncomeCzk(
  makerId: string,
  at = new Date()
): Promise<number> {
  const { start, end } = calendarYearBounds(at);

  const aggregate = await prisma.order.aggregate({
    where: {
      makerId,
      createdAt: { gte: start, lt: end },
      status: { in: INCOME_COUNTING_STATUSES },
    },
    _sum: { printCostCzk: true },
  });

  return aggregate._sum.printCostCzk ?? 0;
}

export async function assertMakerCanAcceptPrintOrder(params: {
  makerId: string;
  makerIco: string | null;
  additionalPrintCostCzk: number;
}): Promise<{ ok: true } | { ok: false; error: string; ytdCzk: number }> {
  const ytdCzk = await getMakerYearToDatePrintIncomeCzk(params.makerId);

  if (
    wouldExceedOccasionalIncomeLimit(
      ytdCzk,
      params.additionalPrintCostCzk,
      params.makerIco
    )
  ) {
    const remaining = remainingOccasionalIncomeCzk(ytdCzk, params.makerIco) ?? 0;
    return {
      ok: false,
      ytdCzk,
      error: `This maker has reached the annual income limit for individuals without IČO (50 000 CZK). Remaining: ${remaining} CZK. The maker must add an IČO to accept further orders.`,
    };
  }

  return { ok: true };
}
