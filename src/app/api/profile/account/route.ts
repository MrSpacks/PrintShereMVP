import { NextResponse } from "next/server";

import {
  clearSessionCookie,
  getSession,
} from "@/lib/auth/session";
import { deleteUserAccount } from "@/lib/users/delete-account";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/types/user";

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { password?: string };
    if (!body.password) {
      return NextResponse.json(
        { error: "Password is required to delete your account" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isAdminUser(user)) {
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

    const passwordValid = await verifyPassword(body.password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    const result = await deleteUserAccount(user.id);

    const response = NextResponse.json({
      success: true,
      refundedOrders: result.refundedOrders,
    });

    return clearSessionCookie(response);
  } catch (error) {
    if (error instanceof Error && error.message === "ACTIVE_ORDERS_REMAIN") {
      return NextResponse.json(
        {
          error:
            "Some orders could not be closed automatically. Contact support before deleting your account.",
        },
        { status: 409 }
      );
    }

    console.error("[DELETE /api/profile/account]", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
