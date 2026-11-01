"use client";

import { useState } from "react";

import {
  OAUTH_PROVIDER_LABELS,
  OAuthProviderButton,
  isOAuthProviderEnabled,
} from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import {
  OAUTH_PROVIDERS,
  isOAuthProvider,
  type OAuthProvider,
} from "@/types/oauth";

interface LinkedAccountsProps {
  providers: string[];
  onChange: (providers: string[]) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function LinkedAccounts({
  providers,
  onChange,
  onError,
  onSuccess,
}: LinkedAccountsProps) {
  const { t } = useTranslations();
  const [unlinking, setUnlinking] = useState<string | null>(null);

  // Configured providers, plus any already-linked one whose button was later disabled
  const visibleProviders = OAUTH_PROVIDERS.filter(
    (provider) => isOAuthProviderEnabled(provider) || providers.includes(provider)
  );

  if (visibleProviders.length === 0) return null;

  const handleUnlink = async (provider: OAuthProvider) => {
    if (!window.confirm(t("auth.unlinkConfirm"))) return;

    setUnlinking(provider);
    onError("");

    try {
      const response = await fetch("/api/auth/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      const data = (await response.json()) as {
        providers?: string[];
        error?: string;
      };

      if (!response.ok) {
        if (data.error === "CANNOT_UNLINK_LAST_AUTH_METHOD") {
          throw new Error(t("auth.oauthErrors.cannot_unlink_last"));
        }
        throw new Error(data.error ?? t("auth.unlinkFailed"));
      }

      onChange(data.providers ?? []);
      onSuccess(t("auth.unlinkSuccess"));
    } catch (unlinkError) {
      onError(
        unlinkError instanceof Error
          ? unlinkError.message
          : t("auth.unlinkFailed")
      );
    } finally {
      setUnlinking(null);
    }
  };

  return (
    <section className="space-y-4 border-t border-border/60 pt-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium text-foreground">
          {t("auth.linkedAccounts")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("auth.linkedAccountsHint")}
        </p>
      </div>

      <div className="space-y-2">
        {visibleProviders.map((provider) =>
          providers.includes(provider) ? (
            <div
              key={provider}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2"
            >
              <div className="text-sm">
                <span className="font-medium">
                  {OAUTH_PROVIDER_LABELS[provider]}
                </span>
                <span className="ml-2 text-muted-foreground">
                  {t("auth.linked")}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={unlinking === provider}
                onClick={() => void handleUnlink(provider)}
              >
                {unlinking === provider ? t("common.loading") : t("auth.unlink")}
              </Button>
            </div>
          ) : (
            <OAuthProviderButton key={provider} provider={provider} mode="link" />
          )
        )}
      </div>
    </section>
  );
}

export function getLinkedProviderLabel(value: string | null): string | null {
  if (!value || !isOAuthProvider(value)) return null;
  return OAUTH_PROVIDER_LABELS[value];
}
