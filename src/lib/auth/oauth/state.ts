import { randomUUID, timingSafeEqual } from "crypto";

import { SignJWT, jwtVerify } from "jose";
import type { NextResponse } from "next/server";

import { isOAuthProvider, type OAuthStatePayload } from "@/types/oauth";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

const OAUTH_NONCE_COOKIE = "printshare_oauth_nonce";
const OAUTH_NONCE_COOKIE_PATH = "/api/auth/oauth";
const OAUTH_STATE_TTL_SECONDS = 15 * 60;

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createOAuthState(
  payload: OAuthStatePayload
): Promise<string> {
  return new SignJWT({
    provider: payload.provider,
    mode: payload.mode,
    next: getSafeRedirectPath(payload.next),
    userId: payload.userId,
    nonce: payload.nonce,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${OAUTH_STATE_TTL_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifyOAuthState(
  token: string
): Promise<OAuthStatePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const provider = payload.provider;
    const mode = payload.mode;
    const next = payload.next;
    const userId = payload.userId;
    const nonce = payload.nonce;

    if (typeof provider !== "string" || !isOAuthProvider(provider)) return null;
    if (mode !== "login" && mode !== "link") return null;
    if (typeof next !== "string") return null;
    if (userId !== undefined && typeof userId !== "string") return null;
    if (typeof nonce !== "string" || !nonce) return null;

    return {
      provider,
      mode,
      next: getSafeRedirectPath(next),
      userId: typeof userId === "string" ? userId : undefined,
      nonce,
    };
  } catch {
    return null;
  }
}

export function createOAuthNonce(): string {
  return randomUUID();
}

/** Binds the OAuth flow to the browser that started it */
export function attachOAuthNonceCookie(response: NextResponse, nonce: string): NextResponse {
  response.cookies.set(OAUTH_NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // lax is enough: providers return via a top-level GET (Apple's POST is bounced to GET)
    sameSite: "lax",
    maxAge: OAUTH_STATE_TTL_SECONDS,
    path: OAUTH_NONCE_COOKIE_PATH,
  });
  return response;
}

export function clearOAuthNonceCookie(response: NextResponse): NextResponse {
  response.cookies.set(OAUTH_NONCE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: OAUTH_NONCE_COOKIE_PATH,
  });
  return response;
}

export function readOAuthNonceCookie(cookieHeader: { get(name: string): { value: string } | undefined }): string | null {
  return cookieHeader.get(OAUTH_NONCE_COOKIE)?.value ?? null;
}

/**
 * Without this check an attacker could start a login with their own account
 * and make the victim's browser finish it (login CSRF).
 */
export function isOAuthNonceValid(state: OAuthStatePayload, cookieNonce: string | null): boolean {
  if (!cookieNonce) return false;
  const expected = Buffer.from(state.nonce);
  const actual = Buffer.from(cookieNonce);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
