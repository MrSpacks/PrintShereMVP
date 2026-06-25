import { NextResponse } from "next/server";

import { mapDispute } from "@/lib/disputes/map-dispute";
import {
  requireModeratorUser,
  unauthorized,
} from "@/lib/moderation/require-moderator";
import { prisma } from "@/lib/prisma";

const DISPUTE_LIST_INCLUDE = {
  evidence: true,
  openedBy: { select: { name: true } },
  resolvedBy: { select: { name: true } },
  order: {
    select: {
      id: true,
      fileName: true,
      customerTotalCzk: true,
      maker: { select: { name: true } },
      customer: { select: { name: true } },
    },
  },
} as const;

/** Otevřené spory pro moderátora */
export async function GET() {
  const user = await requireModeratorUser();
  if (!user) return unauthorized();

  try {
    const disputes = await prisma.dispute.findMany({
      where: { status: "open" },
      include: DISPUTE_LIST_INCLUDE,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      disputes: disputes.map((dispute) => ({
        ...mapDispute(dispute),
        order: {
          fileName: dispute.order.fileName,
          customerTotalCzk: dispute.order.customerTotalCzk,
          makerName: dispute.order.maker.name,
          customerName: dispute.order.customer?.name ?? "—",
        },
      })),
    });
  } catch (error) {
    console.error("[GET /api/moderation/disputes]", error);
    return NextResponse.json(
      { error: "Failed to load disputes" },
      { status: 500 }
    );
  }
}
