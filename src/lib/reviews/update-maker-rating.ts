import { prisma } from "@/lib/prisma";

export async function recalculateMakerRating(makerId: string): Promise<void> {
  const reviews = await prisma.orderReview.findMany({
    where: { order: { makerId } },
    select: { rating: true },
  });

  if (reviews.length === 0) return;

  const average =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  await prisma.maker.update({
    where: { id: makerId },
    data: { rating: Math.round(average * 10) / 10 },
  });
}

export const DISPUTE_ELIGIBLE_STATUSES = [
  "shipped",
  "delivered",
  "completed",
] as const;
