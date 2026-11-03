/**
 * Сброс пароля без новой таблицы в БД.
 *
 * Токен — подписанный JWT (AUTH_SECRET) на 1 час с «отпечатком» текущего
 * passwordHash. После смены пароля отпечаток меняется, поэтому ссылка
 * одноразовая: повторно ею воспользоваться нельзя.
 */

import { createHash } from "node:crypto";

import { SignJWT, jwtVerify } from "jose";

const PURPOSE = "password_reset";
export const PASSWORD_RESET_TTL_MINUTES = 60;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function passwordFingerprint(
  userId: string,
  passwordHash: string | null
): string {
  return createHash("sha256")
    .update(`${userId}:${passwordHash ?? "no-password"}`)
    .digest("base64url")
    .slice(0, 22);
}

export async function createPasswordResetToken(user: {
  id: string;
  passwordHash: string | null;
}): Promise<string> {
  return new SignJWT({
    purpose: PURPOSE,
    fp: passwordFingerprint(user.id, user.passwordHash),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${PASSWORD_RESET_TTL_MINUTES}m`)
    .sign(getSecret());
}

/** Возвращает userId и отпечаток или null, если токен неверный/просрочен. */
export async function readPasswordResetToken(
  token: string
): Promise<{ userId: string; fingerprint: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      payload.purpose !== PURPOSE ||
      typeof payload.sub !== "string" ||
      typeof payload.fp !== "string"
    ) {
      return null;
    }
    return { userId: payload.sub, fingerprint: payload.fp };
  } catch {
    return null;
  }
}

/**
 * Простая защита от спама запросами: не чаще одного письма в 2 минуты
 * на адрес. Память живёт в пределах одного инстанса сервера — этого
 * достаточно, чтобы не слать пачки писем при повторных кликах.
 */
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;
const lastRequestByEmail = new Map<string, number>();

export function isPasswordResetThrottled(email: string, now = Date.now()): boolean {
  const last = lastRequestByEmail.get(email);
  if (last !== undefined && now - last < RESEND_COOLDOWN_MS) return true;

  lastRequestByEmail.set(email, now);
  if (lastRequestByEmail.size > 5000) {
    for (const [key, time] of lastRequestByEmail) {
      if (now - time >= RESEND_COOLDOWN_MS) lastRequestByEmail.delete(key);
    }
  }
  return false;
}
