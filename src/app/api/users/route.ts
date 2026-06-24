import { NextResponse } from "next/server";

import { mapPrismaUser } from "@/lib/users/map-user";
import { prisma } from "@/lib/prisma";

/**
 * Список пользователей (без passwordHash).
 * Для dev/MVP — позже закрыть auth middleware.
 */
export async function GET() {
  try {
    const records = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(records.map(mapPrismaUser));
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
