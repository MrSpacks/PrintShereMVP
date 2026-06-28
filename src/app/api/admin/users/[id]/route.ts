import { NextResponse } from "next/server";

import {
  adminUnauthorized,
  requireAdminUser,
} from "@/lib/admin/require-admin";
import {
  isAssignableStaffRole,
} from "@/lib/admin/user-roles";
import { deleteUserAccount } from "@/lib/users/delete-account";
import { mapPrismaUser } from "@/lib/users/map-user";
import {
  computeBlockedUntil,
  parseBlockDays,
} from "@/lib/users/user-block";
import { prisma } from "@/lib/prisma";
import type { StaffRole } from "@/types/user";
import { isAdminUser } from "@/types/user";

interface RouteParams {
  params: { id: string };
}

interface AdminUserPatchBody {
  staffRole?: StaffRole | null;
  action?: "block" | "unblock";
  blockDays?: number;
}

function parsePatchBody(body: unknown): AdminUserPatchBody | null {
  if (!body || typeof body !== "object") return null;
  const payload = body as Record<string, unknown>;

  let staffRole: StaffRole | null | undefined;
  if (payload.staffRole === null) {
    staffRole = null;
  } else if (typeof payload.staffRole === "string") {
    if (!isAssignableStaffRole(payload.staffRole)) return null;
    staffRole = payload.staffRole;
  }

  return {
    staffRole,
    action:
      payload.action === "block" || payload.action === "unblock"
        ? payload.action
        : undefined,
    blockDays:
      typeof payload.blockDays === "number" ? payload.blockDays : undefined,
  };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return adminUnauthorized();

    const { id } = params;

    if (id === admin.id) {
      return NextResponse.json(
        { error: "Cannot modify your own account here" },
        { status: 400 }
      );
    }

    const body = parsePatchBody(await request.json());
    if (!body) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { ownedMakers: true } } },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: { staffRole?: StaffRole | null; blockedUntil?: Date | null } =
      {};

    if (body.action === "block") {
      const days = parseBlockDays(body.blockDays ?? 7);
      if (!days) {
        return NextResponse.json({ error: "Invalid block duration" }, { status: 400 });
      }
      data.blockedUntil = computeBlockedUntil(days);
    } else if (body.action === "unblock") {
      data.blockedUntil = null;
    }

    if (body.staffRole !== undefined) {
      data.staffRole = body.staffRole;
    }

    if (body.staffRole === undefined && !body.action) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { _count: { select: { ownedMakers: true } } },
    });

    return NextResponse.json({ user: mapPrismaUser(updated) });
  } catch (error) {
    console.error("[PATCH /api/admin/users/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return adminUnauthorized();

    const { id } = params;

    if (id === admin.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (isAdminUser(target)) {
      const adminCount = await prisma.user.count({
        where: { staffRole: "admin" },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin account" },
          { status: 400 }
        );
      }
    }

    await deleteUserAccount(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "ACTIVE_ORDERS_REMAIN") {
      return NextResponse.json(
        { error: "User has active orders that could not be refunded" },
        { status: 409 }
      );
    }

    console.error("[DELETE /api/admin/users/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
