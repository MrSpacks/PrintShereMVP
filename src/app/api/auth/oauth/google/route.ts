import { NextRequest, NextResponse } from "next/server";

import { buildGoogleAuthUrl, getGoogleOAuthConfig } from "@/lib/auth/oauth/google";
import { oauthErrorRedirect } from "@/lib/auth/oauth/redirect";
import { createOAuthState } from "@/lib/auth/oauth/state";
import { getSession } from "@/lib/auth/session";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!getGoogleOAuthConfig()) {
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 503 }
    );
  }

  const mode = request.nextUrl.searchParams.get("mode") === "link" ? "link" : "login";
  const next = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));

  if (mode === "link") {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent("/profile")}`, request.url)
      );
    }

    const state = await createOAuthState({
      mode: "link",
      next: "/profile",
      userId: session.userId,
    });

    return NextResponse.redirect(buildGoogleAuthUrl(state));
  }

  const state = await createOAuthState({ mode: "login", next });
  return NextResponse.redirect(buildGoogleAuthUrl(state));
}
