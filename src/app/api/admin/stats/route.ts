import { NextResponse } from "next/server";

import { computePlatformStats } from "@/lib/admin/compute-platform-stats";
import {
  adminUnauthorized,
  requireAdminUser,
} from "@/lib/admin/require-admin";

export async function GET() {
  try {
    const user = await requireAdminUser();
    if (!user) return adminUnauthorized();

    const stats = await computePlatformStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[GET /api/admin/stats]", error);
    return NextResponse.json(
      { error: "Failed to fetch platform stats" },
      { status: 500 }
    );
  }
}
