import { NextResponse } from "next/server";

import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { mapPrismaUser } from "@/lib/users/map-user";
import { isUserCurrentlyBlocked } from "@/lib/users/user-block";
import { prisma } from "@/lib/prisma";

/** Текущий авторизованный пользователь */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        _count: { select: { ownedMakers: true } },
        ownedMakers: { select: { id: true } },
      },
    });

    if (!user) {
      const response = NextResponse.json({ user: null });
      return clearSessionCookie(response);
    }

    if (isUserCurrentlyBlocked(user.blockedUntil)) {
      const response = NextResponse.json({ user: null, blocked: true });
      return clearSessionCookie(response);
    }

    if (user.blockedUntil && user.blockedUntil <= new Date()) {
      const cleared = await prisma.user.update({
        where: { id: user.id },
        data: { blockedUntil: null },
        include: { _count: { select: { ownedMakers: true } } },
      });
      return NextResponse.json({ user: mapPrismaUser(cleared) });
    }

    return NextResponse.json({ user: mapPrismaUser(user) });
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json({ error: "Session check failed" }, { status: 500 });
  }
}
