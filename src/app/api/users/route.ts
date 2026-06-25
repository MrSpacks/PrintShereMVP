import { NextResponse } from "next/server";

import {
  adminUnauthorized,
  requireAdminUser,
} from "@/lib/admin/require-admin";
import { mapPrismaUser } from "@/lib/users/map-user";
import { prisma } from "@/lib/prisma";

/** Список пользователей — только для admin. */
export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return adminUnauthorized();

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
