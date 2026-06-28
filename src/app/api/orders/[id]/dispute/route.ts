import { NextResponse } from "next/server";

import { validateEvidenceUrls } from "@/lib/disputes/validate-evidence";
import { mapDispute } from "@/lib/disputes/map-dispute";
import { canOpenDispute } from "@/lib/orders/order-workflow";
import {
  getOrderAccess,
  isOrderCustomer,
  notFound,
  unauthorized,
} from "@/lib/orders/require-order-access";
import { prisma } from "@/lib/prisma";
import type { OpenDisputePayload } from "@/types/dispute";

interface RouteParams {
  params: { id: string };
}

function isOpenDisputeBody(body: unknown): body is OpenDisputePayload {
  if (!body || typeof body !== "object") return false;
  const payload = body as Record<string, unknown>;
  return (
    typeof payload.complaintText === "string" &&
    (payload.evidenceUrls === undefined || Array.isArray(payload.evidenceUrls))
  );
}

export async function GET(_request: Request, { params }: RouteParams) {
  const access = await getOrderAccess(params.id);
  if (!access) return unauthorized();

  const dispute = await prisma.dispute.findUnique({
    where: { orderId: params.id },
    include: {
      evidence: true,
      openedBy: { select: { name: true } },
      resolvedBy: { select: { name: true } },
    },
  });

  if (!dispute) {
    return NextResponse.json({ dispute: null });
  }

  return NextResponse.json({ dispute: mapDispute(dispute) });
}

export async function POST(request: Request, { params }: RouteParams) {
  const access = await getOrderAccess(params.id);
  if (!access) return unauthorized();

  if (!isOrderCustomer(access)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (!isOpenDisputeBody(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const complaintText = body.complaintText.trim();
    if (complaintText.length < 10) {
      return NextResponse.json(
        { error: "Complaint text is too short" },
        { status: 400 }
      );
    }

    let evidenceUrls: string[] = [];
    try {
      evidenceUrls = validateEvidenceUrls(body.evidenceUrls);
    } catch (validationError) {
      return NextResponse.json(
        {
          error:
            validationError instanceof Error
              ? validationError.message
              : "Invalid evidence",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { dispute: true },
    });

    if (!order) return notFound();

    if (!canOpenDispute(order.status)) {
      return NextResponse.json(
        { error: "Dispute not allowed in current state" },
        { status: 409 }
      );
    }

    if (order.dispute) {
      return NextResponse.json(
        { error: "Dispute already exists" },
        { status: 409 }
      );
    }

    const dispute = await prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          orderId: order.id,
          openedById: access.user.id,
          statusBeforeDispute: order.status,
          complaintText,
          evidence: {
            create: evidenceUrls.map((imageUrl) => ({ imageUrl })),
          },
        },
        include: {
          evidence: true,
          openedBy: { select: { name: true } },
          resolvedBy: { select: { name: true } },
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: "disputed" },
      });

      return created;
    });

    return NextResponse.json({ dispute: mapDispute(dispute) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/orders/[id]/dispute]", error);
    return NextResponse.json({ error: "Failed to open dispute" }, { status: 500 });
  }
}
