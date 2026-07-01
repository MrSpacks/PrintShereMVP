import { SignJWT, jwtVerify } from "jose";

import type { OAuthStatePayload } from "@/types/oauth";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

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
    mode: payload.mode,
    next: getSafeRedirectPath(payload.next),
    userId: payload.userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getAuthSecret());
}

export async function verifyOAuthState(
  token: string
): Promise<OAuthStatePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const mode = payload.mode;
    const next = payload.next;
    const userId = payload.userId;

    if (mode !== "login" && mode !== "link") return null;
    if (typeof next !== "string") return null;
    if (userId !== undefined && typeof userId !== "string") return null;

    return {
      mode,
      next: getSafeRedirectPath(next),
      userId: typeof userId === "string" ? userId : undefined,
    };
  } catch {
    return null;
  }
}
