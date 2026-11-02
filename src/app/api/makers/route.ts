import { NextResponse } from "next/server";

import { mapPrismaMaker } from "@/lib/makers/map-maker";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Список всех печатников для карты */
export async function GET() {
  try {
    const records = await prisma.maker.findMany({
      where: {
        status: {
          in: ["available", "busy"],
        },
      },
      include: {
        filaments: { orderBy: [{ printerType: "asc" }, { material: "asc" }] },
        _count: {
          select: {
            orders: {
              where: {
                review: {
                  isNot: null,
                },
              },
            },
          },
        },
      },
      orderBy: { rating: "desc" },
    });

    const mapped = records.map((maker) => {
      const base = mapPrismaMaker(maker);
      return {
        ...base,
        reviewsCount: maker._count.orders,
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("[GET /api/makers] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch makers" },
      { status: 500 }
    );
  }
}
