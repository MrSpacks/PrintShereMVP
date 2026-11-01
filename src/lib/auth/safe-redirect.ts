const REDIRECT_BASE = "http://redirect.invalid";

/** Allow only same-origin relative paths after login/signup */
export function getSafeRedirectPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }

  // URL parsers treat "\" as "/" ("/\evil.com" → "//evil.com"), and strip tabs/newlines
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) {
    return "/";
  }

  try {
    const url = new URL(raw, REDIRECT_BASE);
    if (url.origin !== REDIRECT_BASE) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function buildAuthPath(
  path: "/login" | "/signup",
  redirectTo?: string | null
): string {
  const safe = getSafeRedirectPath(redirectTo);
  if (safe === "/") return path;
  return `${path}?next=${encodeURIComponent(safe)}`;
}
