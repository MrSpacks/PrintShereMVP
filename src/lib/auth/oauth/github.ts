import { getSiteUrl } from "@/lib/site";
import type { OAuthProfile } from "@/types/oauth";

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export function getGitHubOAuthConfig(): GitHubOAuthConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    redirectUri: `${getSiteUrl()}/api/auth/oauth/github/callback`,
  };
}

export function buildGitHubAuthUrl(state: string): string {
  const config = getGitHubOAuthConfig();
  if (!config) {
    throw new Error("GitHub OAuth is not configured");
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "read:user user:email",
    state,
    allow_signup: "true",
  });

  return `${GITHUB_AUTH_URL}?${params.toString()}`;
}

/** Only the primary verified address may be used — unverified ones could hijack accounts by email */
export function pickVerifiedPrimaryEmail(emails: GitHubEmail[]): string | null {
  const primary = emails.find((entry) => entry.primary && entry.verified);
  return primary?.email ?? null;
}

async function githubApi<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "PrintShare",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function exchangeGitHubCode(code: string): Promise<OAuthProfile> {
  const config = getGitHubOAuthConfig();
  if (!config) {
    throw new Error("GitHub OAuth is not configured");
  }

  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange GitHub authorization code");
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("GitHub token response missing access_token");
  }

  const [user, emails] = await Promise.all([
    githubApi<GitHubUser>("/user", tokenData.access_token),
    githubApi<GitHubEmail[]>("/user/emails", tokenData.access_token),
  ]);

  const email = pickVerifiedPrimaryEmail(emails);
  if (!user.id || !email) {
    throw new Error("GitHub account has no verified primary email");
  }

  return {
    providerAccountId: String(user.id),
    email,
    name: user.name ?? user.login,
    picture: user.avatar_url ?? undefined,
  };
}
