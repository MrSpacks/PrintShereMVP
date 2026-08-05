import { NextResponse } from "next/server";

import { mapPrismaMaker } from "@/lib/makers/map-maker";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Список всех печатников для карты */
export async function GET() {
  try {
    const records = await prisma.maker.findMany({
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

    console.log("[GET /api/makers] Found makers:", {
      count: records.length,
      ids: records.map((m) => m.id),
    });

    const mapped = records.map((maker) => {
      const base = mapPrismaMaker(maker);
      return {
        ...base,
        reviewsCount: maker._count.orders,
      };
    });
    console.log("[GET /api/makers] Returning:", mapped.length);

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("[GET /api/makers] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch makers" },
      { status: 500 }
    );
  }
}
