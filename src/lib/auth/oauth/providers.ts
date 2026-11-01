import { buildAppleAuthUrl, exchangeAppleCode, getAppleOAuthConfig } from "@/lib/auth/oauth/apple";
import { buildGitHubAuthUrl, exchangeGitHubCode, getGitHubOAuthConfig } from "@/lib/auth/oauth/github";
import { buildGoogleAuthUrl, exchangeGoogleCode, getGoogleOAuthConfig } from "@/lib/auth/oauth/google";
import type { OAuthProfile, OAuthProvider } from "@/types/oauth";

export interface OAuthCallbackParams {
  code: string;
  /** Apple only: JSON with the user's name, sent on first authorization */
  user: string | null;
}

interface OAuthProviderAdapter {
  isConfigured: () => boolean;
  buildAuthUrl: (state: string) => string;
  exchangeCode: (params: OAuthCallbackParams) => Promise<OAuthProfile>;
}

const ADAPTERS: Record<OAuthProvider, OAuthProviderAdapter> = {
  google: {
    isConfigured: () => Boolean(getGoogleOAuthConfig()),
    buildAuthUrl: buildGoogleAuthUrl,
    exchangeCode: ({ code }) => exchangeGoogleCode(code),
  },
  github: {
    isConfigured: () => Boolean(getGitHubOAuthConfig()),
    buildAuthUrl: buildGitHubAuthUrl,
    exchangeCode: ({ code }) => exchangeGitHubCode(code),
  },
  apple: {
    isConfigured: () => Boolean(getAppleOAuthConfig()),
    buildAuthUrl: buildAppleAuthUrl,
    exchangeCode: ({ code, user }) => exchangeAppleCode(code, user),
  },
};

export function getOAuthAdapter(provider: OAuthProvider): OAuthProviderAdapter {
  return ADAPTERS[provider];
}
