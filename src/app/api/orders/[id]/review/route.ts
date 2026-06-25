import { NextResponse } from "next/server";

import {
  getOrderAccess,
  notFound,
  unauthorized,
} from "@/lib/orders/require-order-access";
import { canSubmitReview } from "@/lib/orders/order-workflow";
import { mapOrder, ORDER_DETAIL_INCLUDE } from "@/lib/orders/map-order";
import { recalculateMakerRating } from "@/lib/reviews/update-maker-rating";
import { prisma } from "@/lib/prisma";
import type { SubmitReviewPayload } from "@/types/review";

interface RouteParams {
  params: { id: string };
}

function isReviewBody(body: unknown): body is SubmitReviewPayload {
  if (!body || typeof body !== "object") return false;
  const payload = body as Record<string, unknown>;
  return (
    typeof payload.rating === "number" &&
    (payload.comment === undefined || typeof payload.comment === "string")
  );
}

export async function POST(request: Request, { params }: RouteParams) {
  const access = await getOrderAccess(params.id);
  if (!access) return unauthorized();

  if (access.user.role !== "customer" || access.order.customerId !== access.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (!isReviewBody(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const rating = Math.round(body.rating);
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { review: true },
    });

    if (!order) return notFound();

    if (!canSubmitReview(order.status)) {
      return NextResponse.json(
        { error: "Review not allowed in current state" },
        { status: 409 }
      );
    }

    if (order.review) {
      return NextResponse.json(
        { error: "Review already submitted" },
        { status: 409 }
      );
    }

    const comment = body.comment?.trim() || null;

    await prisma.$transaction([
      prisma.orderReview.create({
        data: {
          orderId: order.id,
          customerId: access.user.id,
          rating,
          comment,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: "completed" },
      }),
    ]);

    await recalculateMakerRating(order.makerId);

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: ORDER_DETAIL_INCLUDE,
    });

    return NextResponse.json({ order: mapOrder(updated!) });
  } catch (error) {
    console.error("[POST /api/orders/[id]/review]", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
