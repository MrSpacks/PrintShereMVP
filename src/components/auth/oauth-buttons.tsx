"use client";

import type { ComponentType } from "react";

import { useTranslations } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { OAUTH_PROVIDERS, type OAuthProvider } from "@/types/oauth";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12.02c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.53 11.53 0 0 0 23.5 12.02C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.37 12.73c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.27-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.66ZM14.1 5.98c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.27Z" />
    </svg>
  );
}

const PROVIDER_ICONS: Record<OAuthProvider, ComponentType<{ className?: string }>> = {
  google: GoogleIcon,
  github: GitHubIcon,
  apple: AppleIcon,
};

export const OAUTH_PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: "Google",
  github: "GitHub",
  apple: "Apple",
};

/** NEXT_PUBLIC_* vars are inlined at build time, so each must be read literally */
const ENABLED_PROVIDERS: Record<OAuthProvider, boolean> = {
  google: Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()),
  github: Boolean(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID?.trim()),
  apple: Boolean(process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim()),
};

export function isOAuthProviderEnabled(provider: OAuthProvider): boolean {
  return ENABLED_PROVIDERS[provider];
}

export function getEnabledOAuthProviders(): OAuthProvider[] {
  return OAUTH_PROVIDERS.filter(isOAuthProviderEnabled);
}

interface OAuthProviderButtonProps {
  provider: OAuthProvider;
  mode?: "login" | "link";
  next?: string;
  className?: string;
}

export function OAuthProviderButton({
  provider,
  mode = "login",
  next = "/",
  className,
}: OAuthProviderButtonProps) {
  const { t } = useTranslations();

  if (!isOAuthProviderEnabled(provider)) return null;

  const params = new URLSearchParams();
  if (mode === "link") {
    params.set("mode", "link");
  } else if (next && next !== "/") {
    params.set("next", next);
  }

  const href = `/api/auth/oauth/${provider}${params.toString() ? `?${params.toString()}` : ""}`;
  const Icon = PROVIDER_ICONS[provider];
  const label = OAUTH_PROVIDER_LABELS[provider];

  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium shadow-sm transition-colors",
        // Apple's guidelines ask for a solid black (or white) button
        provider === "apple"
          ? "border-black bg-black text-white hover:bg-black/85 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/85"
          : "border-input bg-background hover:bg-muted",
        className
      )}
    >
      <Icon className="h-5 w-5" />
      {mode === "link"
        ? t("auth.linkProvider", { provider: label })
        : t("auth.continueWithProvider", { provider: label })}
    </a>
  );
}

interface OAuthButtonsProps {
  next?: string;
}

/** All configured sign-in providers plus the "or" divider; renders nothing when none are set up */
export function OAuthButtons({ next = "/" }: OAuthButtonsProps) {
  const providers = getEnabledOAuthProviders();
  if (providers.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        {providers.map((provider) => (
          <OAuthProviderButton key={provider} provider={provider} next={next} />
        ))}
      </div>
      <OAuthDivider />
    </>
  );
}

export function OAuthDivider() {
  const { t } = useTranslations();

  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">
          {t("auth.orContinueWith")}
        </span>
      </div>
    </div>
  );
}

export function mapOAuthError(
  code: string | null,
  t: (key: string) => string
): string | null {
  if (!code) return null;

  const key = `auth.oauthErrors.${code}` as const;
  const translated = t(key);
  if (translated !== key) return translated;

  return t("auth.oauthErrors.oauth_failed");
}
