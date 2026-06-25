import { NextResponse } from "next/server";

import {
  adminUnauthorized,
  requireAdminUser,
} from "@/lib/admin/require-admin";
import {
  isAssignableRole,
  validateRoleAssignment,
} from "@/lib/admin/user-roles";
import { mapPrismaUser } from "@/lib/users/map-user";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return adminUnauthorized();

    const { id } = await params;

    if (id === admin.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as { role?: string };
    if (!body.role || !isAssignableRole(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const roleError = validateRoleAssignment(
      body.role as UserRole,
      Boolean(target.makerId)
    );
    if (roleError) {
      return NextResponse.json({ error: roleError }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: body.role as UserRole },
    });

    return NextResponse.json({ user: mapPrismaUser(updated) });
  } catch (error) {
    console.error("[PATCH /api/admin/users/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
