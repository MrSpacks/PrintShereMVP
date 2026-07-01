export const OAUTH_PROVIDERS = ["google", "github"] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

export type OAuthMode = "login" | "link";

export interface OAuthStatePayload {
  mode: OAuthMode;
  next: string;
  userId?: string;
}
