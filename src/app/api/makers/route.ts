import { NextResponse } from "next/server";

import { mapPrismaMaker } from "@/lib/makers/map-maker";
import { prisma } from "@/lib/prisma";

/** Список всех печатников для карты */
export async function GET() {
  try {
    const records = await prisma.maker.findMany({
      include: {
        filaments: { orderBy: [{ printerType: "asc" }, { material: "asc" }] },
      },
      orderBy: { rating: "desc" },
    });

    console.log("[GET /api/makers] Found makers:", {
      count: records.length,
      ids: records.map((m) => m.id),
    });

    const mapped = records.map(mapPrismaMaker);
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
