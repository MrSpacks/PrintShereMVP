import { NextResponse } from "next/server";

import { hashPassword, isValidPassword } from "@/lib/auth/password";
import {
  passwordFingerprint,
  readPasswordResetToken,
} from "@/lib/auth/password-reset";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/password/reset { token, password }
 * Ставит новый пароль по ссылке из письма. После этого пользователь входит обычным способом.
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const payload =
      body && typeof body === "object"
        ? (body as { token?: unknown; password?: unknown })
        : {};

    if (typeof payload.token !== "string" || typeof payload.password !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!isValidPassword(payload.password)) {
      return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
    }

    const token = await readPasswordResetToken(payload.token);
    if (!token) {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: token.userId },
      select: { id: true, passwordHash: true },
    });

    if (
      !user ||
      passwordFingerprint(user.id, user.passwordHash) !== token.fingerprint
    ) {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(payload.password) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/auth/password/reset]", error);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
