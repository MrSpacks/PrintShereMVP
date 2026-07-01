import { NextResponse } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

import { getSiteUrl } from "@/lib/site";

export function oauthErrorRedirect(
  code: string,
  next?: string
): NextResponse {
  const origin = getSiteUrl();
  const safeNext = getSafeRedirectPath(next);

  if (safeNext === "/profile") {
    const url = new URL("/profile", origin);
    url.searchParams.set("error", code);
    return NextResponse.redirect(url);
  }

  const path = safeNext === "/" ? "/login" : `/login?next=${encodeURIComponent(safeNext)}`;
  const separator = path.includes("?") ? "&" : "?";
  return NextResponse.redirect(
    new URL(`${path}${separator}error=${code}`, origin)
  );
}

export function oauthSuccessRedirect(next: string): NextResponse {
  return NextResponse.redirect(new URL(getSafeRedirectPath(next), getSiteUrl()));
}
