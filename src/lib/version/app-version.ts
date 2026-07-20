/**
 * Идентификатор текущей сборки / деплоя.
 * На Vercel меняется при каждом deploy (даже тот же commit).
 * Локально — стабильный "dev", чтобы не мешать разработке.
 */
export function getAppVersion(): string {
  if (process.env.NODE_ENV === "development") {
    return "dev";
  }

  return (
    process.env.NEXT_PUBLIC_APP_VERSION ??
    process.env.VERCEL_DEPLOYMENT_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    "unknown"
  );
}

/** Есть ли на сервере более новая сборка, чем у открытой вкладки */
export function isNewerAppVersion(
  clientVersion: string,
  serverVersion: string
): boolean {
  if (!clientVersion || !serverVersion) return false;
  if (clientVersion === "dev" || serverVersion === "dev") return false;
  return clientVersion !== serverVersion;
}
