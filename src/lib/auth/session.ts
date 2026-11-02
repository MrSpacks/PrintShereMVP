import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isUserCurrentlyBlocked } from "@/lib/users/user-block";
import type { UserRole } from "@/types/user";

export const SESSION_COOKIE_NAME = "printlocal_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add it to .env.local (e.g. openssl rand -base64 32)"
    );
  }

  return new TextEncoder().encode(secret);
}

/** Создаёт подписанный JWT для httpOnly cookie */
export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());
}

/** Проверяет JWT и возвращает payload сессии */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const userId = payload.userId;
    const email = payload.email;
    const name = payload.name;
    const role = payload.role;

    if (
      typeof userId !== "string" ||
      typeof email !== "string" ||
      typeof name !== "string" ||
      typeof role !== "string"
    ) {
      return null;
    }

    return {
      userId,
      email,
      name,
      role: role as UserRole,
    };
  } catch {
    return null;
  }
}

/** Только подпись JWT, без проверки пользователя в БД — для /api/auth/me */
export async function getSessionPayload(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Текущая сессия (server-side). JWT живёт 7 дней, поэтому блокировка и
 * удаление аккаунта проверяются в БД на каждом запросе, а не только при входе.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const session = await getSessionPayload();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { blockedUntil: true },
  });

  if (!user || isUserCurrentlyBlocked(user.blockedUntil)) return null;

  return session;
}

export function attachSessionCookie(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
