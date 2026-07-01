import { NextRequest, NextResponse } from "next/server";

import { exchangeGoogleCode } from "@/lib/auth/oauth/google";
import {
  oauthErrorRedirect,
  oauthSuccessRedirect,
} from "@/lib/auth/oauth/redirect";
import {
  OAuthResolveFailure,
  resolveGoogleSignIn,
} from "@/lib/auth/oauth/resolve-google-sign-in";
import { verifyOAuthState } from "@/lib/auth/oauth/state";
import {
  attachSessionCookie,
  createSessionToken,
  getSession,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function mapResolveError(code: string): string {
  switch (code) {
    case "EMAIL_MISMATCH":
      return "oauth_email_mismatch";
    case "GOOGLE_ALREADY_LINKED":
      return "oauth_google_linked";
    case "ACCOUNT_BLOCKED":
      return "oauth_account_blocked";
    case "LINK_SESSION_MISMATCH":
      return "oauth_link_session";
    default:
      return "oauth_failed";
  }
}

export async function GET(request: NextRequest) {
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
  if (!state) {
    return oauthErrorRedirect("oauth_failed");
  }

  if (state.mode === "link") {
    const session = await getSession();
    if (!session || session.userId !== state.userId) {
      return oauthErrorRedirect("oauth_link_session", state.next);
    }
  }

  try {
    const profile = await exchangeGoogleCode(code);
    const user = await resolveGoogleSignIn({
      googleId: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      mode: state.mode,
      linkUserId: state.userId,
    });

    if (state.mode === "link") {
      const redirectUrl = new URL(state.next, request.url);
      redirectUrl.searchParams.set("linked", "google");
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

    console.error("[GET /api/auth/oauth/google/callback]", resolveError);
    return oauthErrorRedirect("oauth_failed", state.next);
  }
}
