import { NextResponse } from "next/server";

import {
  adminUnauthorized,
  requireAdminUser,
} from "@/lib/admin/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAdminUser();
    if (!user) return adminUnauthorized();

    const makers = await prisma.maker.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            filaments: true,
            printers: true,
          },
        },
        orders: {
          where: {
            review: {
              isNot: null,
            },
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = makers.map((maker) => ({
      id: maker.id,
      name: maker.name,
      address: maker.address,
      status: maker.status,
      rating: maker.rating,
      reviewsCount: maker.orders.length,
      printerTypes: maker.printerTypes,
      ordersCount: maker._count.orders,
      filamentsCount: maker._count.filaments,
      printersCount: maker._count.printers,
      createdAt: maker.createdAt.toISOString(),
    }));

    return NextResponse.json({ makers: mapped });
  } catch (error) {
    console.error("[GET /api/admin/makers]", error);
    return NextResponse.json(
      { error: "Failed to fetch makers" },
      { status: 500 }
    );
  }
}
