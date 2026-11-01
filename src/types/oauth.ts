export const OAUTH_PROVIDERS = ["google", "github", "apple"] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

export type OAuthMode = "login" | "link";

export interface OAuthStatePayload {
  provider: OAuthProvider;
  mode: OAuthMode;
  next: string;
  userId?: string;
}

/** Normalized identity returned by every provider after code exchange */
export interface OAuthProfile {
  providerAccountId: string;
  email: string;
  name?: string;
  picture?: string;
}
