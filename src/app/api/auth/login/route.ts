import { NextResponse } from "next/server";

import {
  attachSessionCookie,
  createSessionToken,
} from "@/lib/auth/session";
import { isValidEmail, verifyPassword } from "@/lib/auth/password";
import { mapPrismaUser } from "@/lib/users/map-user";
import {
  isUserCurrentlyBlocked,
} from "@/lib/users/user-block";
import { prisma } from "@/lib/prisma";

interface LoginBody {
  email: string;
  password: string;
}

function isLoginBody(body: unknown): body is LoginBody {
  if (!body || typeof body !== "object") return false;
  const payload = body as Record<string, unknown>;
  return (
    typeof payload.email === "string" &&
    typeof payload.password === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isLoginBody(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        _count: { select: { ownedMakers: true } },
        ownedMakers: { select: { id: true } },
      },
    });

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (isUserCurrentlyBlocked(user.blockedUntil)) {
      return NextResponse.json({ error: "ACCOUNT_BLOCKED" }, { status: 403 });
    }

    if (user.blockedUntil && user.blockedUntil <= new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { blockedUntil: null },
      });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({ user: mapPrismaUser(user) });
    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
