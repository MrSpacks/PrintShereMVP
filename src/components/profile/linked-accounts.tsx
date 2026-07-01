"use client";

import { useState } from "react";

import {
  GoogleOAuthButton,
  isGoogleOAuthEnabled,
} from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import type { OAuthProvider } from "@/types/oauth";

interface LinkedAccountsProps {
  providers: string[];
  onChange: (providers: string[]) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

function providerLabel(provider: OAuthProvider, t: (key: string) => string) {
  if (provider === "google") return "Google";
  if (provider === "github") return "GitHub";
  return provider;
}

export function LinkedAccounts({
  providers,
  onChange,
  onError,
  onSuccess,
}: LinkedAccountsProps) {
  const { t } = useTranslations();
  const [unlinking, setUnlinking] = useState<string | null>(null);

  const googleLinked = providers.includes("google");
  const showSection = isGoogleOAuthEnabled() || providers.length > 0;

  if (!showSection) return null;

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

      {googleLinked ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
          <div className="text-sm">
            <span className="font-medium">Google</span>
            <span className="ml-2 text-muted-foreground">
              {t("auth.linked")}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={unlinking === "google"}
            onClick={() => void handleUnlink("google")}
          >
            {unlinking === "google" ? t("common.loading") : t("auth.unlink")}
          </Button>
        </div>
      ) : (
        <GoogleOAuthButton mode="link" />
      )}

      {providers
        .filter((provider) => provider !== "google")
        .map((provider) => (
          <div
            key={provider}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2"
          >
            <div className="text-sm">
              <span className="font-medium">
                {providerLabel(provider as OAuthProvider, t)}
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
              onClick={() => void handleUnlink(provider as OAuthProvider)}
            >
              {unlinking === provider ? t("common.loading") : t("auth.unlink")}
            </Button>
          </div>
        ))}
    </section>
  );
}
