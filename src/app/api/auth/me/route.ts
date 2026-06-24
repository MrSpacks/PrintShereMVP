import { NextResponse } from "next/server";

import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { mapPrismaUser } from "@/lib/users/map-user";
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
    });

    if (!user) {
      const response = NextResponse.json({ user: null });
      return clearSessionCookie(response);
    }

    return NextResponse.json({ user: mapPrismaUser(user) });
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json({ error: "Session check failed" }, { status: 500 });
  }
}
