import { NextResponse } from "next/server";

import { mapDispute } from "@/lib/disputes/map-dispute";
import {
  requireModeratorUser,
  unauthorized,
} from "@/lib/moderation/require-moderator";
import { mapOrder, ORDER_DETAIL_INCLUDE } from "@/lib/orders/map-order";
import { prisma } from "@/lib/prisma";
import type { DisputeResolution, ResolveDisputePayload } from "@/types/dispute";

function notFoundResponse() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

interface RouteParams {
  params: { id: string };
}

function isResolveBody(body: unknown): body is ResolveDisputePayload {
  if (!body || typeof body !== "object") return false;
  const payload = body as Record<string, unknown>;
  return (
    (payload.resolution === "refund" || payload.resolution === "rejected") &&
    typeof payload.resolutionText === "string" &&
    (payload.refundAmountCzk === undefined ||
      typeof payload.refundAmountCzk === "number")
  );
}

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await requireModeratorUser();
  if (!user) return unauthorized();

  const dispute = await prisma.dispute.findUnique({
    where: { id: params.id },
    include: {
      evidence: true,
      openedBy: { select: { name: true } },
      resolvedBy: { select: { name: true } },
      order: { include: ORDER_DETAIL_INCLUDE },
    },
  });

  if (!dispute) return notFoundResponse();

  return NextResponse.json({
    dispute: mapDispute(dispute),
    order: mapOrder(dispute.order),
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await requireModeratorUser();
  if (!user) return unauthorized();

  try {
    const body: unknown = await request.json();
    if (!isResolveBody(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const resolutionText = body.resolutionText.trim();
    if (resolutionText.length < 5) {
      return NextResponse.json(
        { error: "Resolution text is too short" },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: { order: true },
    });

    if (!dispute) return notFoundResponse();

    if (dispute.status !== "open") {
      return NextResponse.json(
        { error: "Dispute is already resolved" },
        { status: 409 }
      );
    }

    const resolution = body.resolution as DisputeResolution;
    let refundAmountCzk: number | null = null;

    if (resolution === "refund") {
      refundAmountCzk =
        body.refundAmountCzk ?? dispute.order.customerTotalCzk;
      if (refundAmountCzk <= 0) {
        return NextResponse.json(
          { error: "Invalid refund amount" },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: dispute.id },
        data: {
          status: "resolved",
          resolution,
          resolutionText,
          refundAmountCzk,
          resolvedById: user.id,
          resolvedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: dispute.orderId },
        data: {
          status:
            resolution === "refund"
              ? "refunded"
              : dispute.statusBeforeDispute,
        },
      });
    });

    const updated = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: {
        evidence: true,
        openedBy: { select: { name: true } },
        resolvedBy: { select: { name: true } },
        order: { include: ORDER_DETAIL_INCLUDE },
      },
    });

    return NextResponse.json({
      dispute: mapDispute(updated!),
      order: mapOrder(updated!.order),
    });
  } catch (error) {
    console.error("[PATCH /api/moderation/disputes/[id]]", error);
    return NextResponse.json(
      { error: "Failed to resolve dispute" },
      { status: 500 }
    );
  }
}
