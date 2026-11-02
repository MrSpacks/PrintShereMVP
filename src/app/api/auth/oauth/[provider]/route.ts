import { NextRequest, NextResponse } from "next/server";

import { getOAuthAdapter } from "@/lib/auth/oauth/providers";
import {
  attachOAuthNonceCookie,
  createOAuthNonce,
  createOAuthState,
} from "@/lib/auth/oauth/state";
import { getSession } from "@/lib/auth/session";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { isOAuthProvider } from "@/types/oauth";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ provider: string }>;
}

export async function GET(request: NextRequest, props: RouteParams) {
  const { provider } = await props.params;

  if (!isOAuthProvider(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const adapter = getOAuthAdapter(provider);
  if (!adapter.isConfigured()) {
    return NextResponse.json(
      { error: `${provider} OAuth is not configured` },
      { status: 503 }
    );
  }

  const mode = request.nextUrl.searchParams.get("mode") === "link" ? "link" : "login";
  const next = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));

  const nonce = createOAuthNonce();

  if (mode === "link") {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent("/profile")}`, request.url)
      );
    }

    const state = await createOAuthState({
      provider,
      mode: "link",
      next: "/profile",
      userId: session.userId,
      nonce,
    });

    return attachOAuthNonceCookie(
      NextResponse.redirect(adapter.buildAuthUrl(state)),
      nonce
    );
  }

  const state = await createOAuthState({ provider, mode: "login", next, nonce });
  return attachOAuthNonceCookie(
    NextResponse.redirect(adapter.buildAuthUrl(state)),
    nonce
  );
}
