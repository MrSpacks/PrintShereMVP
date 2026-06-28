/** Allow only same-origin relative paths after login/signup */
export function getSafeRedirectPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

export function buildAuthPath(
  path: "/login" | "/signup",
  redirectTo?: string | null
): string {
  const safe = getSafeRedirectPath(redirectTo);
  if (safe === "/") return path;
  return `${path}?next=${encodeURIComponent(safe)}`;
}
