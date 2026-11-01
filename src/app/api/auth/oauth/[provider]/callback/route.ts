import { NextRequest, NextResponse } from "next/server";

import { getOAuthAdapter } from "@/lib/auth/oauth/providers";
import {
  oauthErrorRedirect,
  oauthSuccessRedirect,
} from "@/lib/auth/oauth/redirect";
import {
  OAuthResolveFailure,
  resolveOAuthSignIn,
} from "@/lib/auth/oauth/resolve-oauth-sign-in";
import { verifyOAuthState } from "@/lib/auth/oauth/state";
import {
  attachSessionCookie,
  createSessionToken,
  getSession,
} from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/site";
import { isOAuthProvider } from "@/types/oauth";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ provider: string }>;
}

function mapResolveError(code: string): string {
  switch (code) {
    case "EMAIL_MISMATCH":
      return "oauth_email_mismatch";
    case "PROVIDER_ALREADY_LINKED":
      return "oauth_provider_linked";
    case "ACCOUNT_BLOCKED":
      return "oauth_account_blocked";
    case "LINK_SESSION_MISMATCH":
      return "oauth_link_session";
    default:
      return "oauth_failed";
  }
}

export async function GET(request: NextRequest, props: RouteParams) {
  const { provider } = await props.params;
  if (!isOAuthProvider(provider)) {
    return oauthErrorRedirect("oauth_failed");
  }

  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    return oauthErrorRedirect("oauth_cancelled");
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateToken = request.nextUrl.searchParams.get("state");

  if (!code || !stateToken) {
    return oauthErrorRedirect("oauth_failed");
  }

  const state = await verifyOAuthState(stateToken);
  // State must come from this provider's start route, not be replayed from another
  if (!state || state.provider !== provider) {
    return oauthErrorRedirect("oauth_failed");
  }

  if (state.mode === "link") {
    const session = await getSession();
    if (!session || session.userId !== state.userId) {
      return oauthErrorRedirect("oauth_link_session", state.next);
    }
  }

  try {
    const profile = await getOAuthAdapter(provider).exchangeCode({
      code,
      user: request.nextUrl.searchParams.get("user"),
    });
    const user = await resolveOAuthSignIn({
      provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      mode: state.mode,
      linkUserId: state.userId,
    });

    if (state.mode === "link") {
      const redirectUrl = new URL(state.next, getSiteUrl());
      redirectUrl.searchParams.set("linked", provider);
      return NextResponse.redirect(redirectUrl);
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = oauthSuccessRedirect(state.next);
    return attachSessionCookie(response, token);
  } catch (resolveError) {
    if (resolveError instanceof OAuthResolveFailure) {
      return oauthErrorRedirect(mapResolveError(resolveError.code), state.next);
    }

    console.error(`[GET /api/auth/oauth/${provider}/callback]`, resolveError);
    return oauthErrorRedirect("oauth_failed", state.next);
  }
}

/**
 * Apple returns the result as a cross-site form POST (response_mode=form_post).
 * SameSite=lax session cookies are not sent on that request, so bounce it to a
 * same-origin GET where the session is available and the normal flow runs.
 */
export async function POST(request: NextRequest, props: RouteParams) {
  const { provider } = await props.params;
  if (provider !== "apple") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const form = await request.formData().catch(() => null);
  const target = new URL(`/api/auth/oauth/${provider}/callback`, getSiteUrl());

  for (const key of ["code", "state", "user", "error"]) {
    const value = form?.get(key);
    if (typeof value === "string" && value) {
      target.searchParams.set(key, value);
    }
  }

  return NextResponse.redirect(target, 303);
}
