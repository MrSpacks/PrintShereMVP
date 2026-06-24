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

    return NextResponse.json(records.map(mapPrismaMaker));
  } catch (error) {
    console.error("[GET /api/makers]", error);
    return NextResponse.json(
      { error: "Failed to fetch makers" },
      { status: 500 }
    );
  }
}
