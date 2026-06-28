import { NextResponse } from "next/server";

import {
  adminUnauthorized,
  requireAdminUser,
} from "@/lib/admin/require-admin";
import { getSession } from "@/lib/auth/session";
import { mapPublicUserProfile } from "@/lib/users/map-public-profile";
import { prisma } from "@/lib/prisma";
import { isModeratorRole } from "@/types/user";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const viewer = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!viewer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSelf = viewer.id === params.id;
    const canManage = isModeratorRole(viewer.role);

    if (!isSelf && !canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orderCount = await prisma.order.count({
      where: { customerId: params.id },
    });

    return NextResponse.json({
      profile: mapPublicUserProfile(target, orderCount, canManage && !isSelf),
    });
  } catch (error) {
    console.error("[GET /api/users/[id]]", error);
    return NextResponse.json(
      { error: "Failed to load user profile" },
      { status: 500 }
    );
  }
}
