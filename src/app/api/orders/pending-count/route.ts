import { NextResponse } from "next/server";

import { isMakerInboxStatus } from "@/lib/orders/order-workflow";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { hasMakerAccess } from "@/types/user";

/** Počet aktivních objednávek pro výrobce (badge v hlavičce). */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !hasMakerAccess(user)) {
      return NextResponse.json({ count: 0 });
    }
    const makerId = user.makerId;
    if (!makerId) {
      return NextResponse.json({ count: 0 });
    }

    const orders = await prisma.order.findMany({
      where: { makerId },
      select: { status: true },
    });

    const count = orders.filter((order) =>
      isMakerInboxStatus(order.status)
    ).length;

    return NextResponse.json({ count });
  } catch (error) {
    console.error("[GET /api/orders/pending-count]", error);
    return NextResponse.json(
      { error: "Failed to fetch pending count" },
      { status: 500 }
    );
  }
}
