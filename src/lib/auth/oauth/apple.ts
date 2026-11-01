import { SignJWT, createRemoteJWKSet, importPKCS8, jwtVerify } from "jose";

import { getSiteUrl } from "@/lib/site";
import type { OAuthProfile } from "@/types/oauth";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_AUTH_URL = `${APPLE_ISSUER}/auth/authorize`;
const APPLE_TOKEN_URL = `${APPLE_ISSUER}/auth/token`;
const APPLE_JWKS = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));

export interface AppleOAuthConfig {
  /** Services ID (e.g. xyz.3dprintshare.web), not the App ID */
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
  redirectUri: string;
}

export function getAppleOAuthConfig(): AppleOAuthConfig | null {
  const clientId = process.env.APPLE_CLIENT_ID?.trim();
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  // Vercel env values often keep the .p8 newlines escaped
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!clientId || !teamId || !keyId || !privateKey) return null;

  return {
    clientId,
    teamId,
    keyId,
    privateKey,
    redirectUri: `${getSiteUrl()}/api/auth/oauth/apple/callback`,
  };
}

export function buildAppleAuthUrl(state: string): string {
  const config = getAppleOAuthConfig();
  if (!config) {
    throw new Error("Apple OAuth is not configured");
  }

  // Apple requires form_post whenever name/email scopes are requested
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    response_mode: "form_post",
    scope: "name email",
    state,
  });

  return `${APPLE_AUTH_URL}?${params.toString()}`;
}

/** Apple has no static client secret: it is a short-lived ES256 JWT signed with the .p8 key */
export async function createAppleClientSecret(
  config: Pick<AppleOAuthConfig, "clientId" | "teamId" | "keyId" | "privateKey">
): Promise<string> {
  const key = await importPKCS8(config.privateKey, "ES256");

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: config.keyId })
    .setIssuer(config.teamId)
    .setSubject(config.clientId)
    .setAudience(APPLE_ISSUER)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}

/** Apple sends the name only on the very first authorization, as JSON in the `user` form field */
export function parseAppleUserName(raw: string | null): string | undefined {
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as {
      name?: { firstName?: string; lastName?: string };
    };
    const name = [parsed.name?.firstName, parsed.name?.lastName]
      .filter((part) => typeof part === "string" && part.trim())
      .join(" ")
      .trim();
    return name || undefined;
  } catch {
    return undefined;
  }
}

export async function exchangeAppleCode(
  code: string,
  rawUser: string | null
): Promise<OAuthProfile> {
  const config = getAppleOAuthConfig();
  if (!config) {
    throw new Error("Apple OAuth is not configured");
  }

  const tokenResponse = await fetch(APPLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: await createAppleClientSecret(config),
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange Apple authorization code");
  }

  const tokenData = (await tokenResponse.json()) as { id_token?: string };
  if (!tokenData.id_token) {
    throw new Error("Apple token response missing id_token");
  }

  const { payload } = await jwtVerify(tokenData.id_token, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience: config.clientId,
  });

  const email = payload.email;
  const emailVerified =
    payload.email_verified === true || payload.email_verified === "true";

  if (typeof payload.sub !== "string" || typeof email !== "string") {
    throw new Error("Apple profile is missing required fields");
  }

  if (!emailVerified) {
    throw new Error("Apple email is not verified");
  }

  return {
    providerAccountId: payload.sub,
    email,
    name: parseAppleUserName(rawUser),
  };
}
