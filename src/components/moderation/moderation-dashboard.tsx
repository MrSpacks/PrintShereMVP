"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppPage } from "@/components/layout/app-page";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";
import { isModerationNavVisible } from "@/lib/product/product-mode";
import { isModeratorUser } from "@/types/user";
import type { DisputeSummary } from "@/types/dispute";

interface DisputeListItem extends DisputeSummary {
  order: {
    fileName: string;
    customerTotalCzk: number;
    makerName: string;
    customerName: string;
  };
}

export function ModerationDashboard() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslations();
  const [disputes, setDisputes] = useState<DisputeListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const loadDisputes = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch("/api/moderation/disputes");
      if (!response.ok) throw new Error("Failed");
      const data = (await response.json()) as { disputes: DisputeListItem[] };
      setDisputes(data.disputes);
    } catch {
      setError(t("moderation.loadFailed"));
    } finally {
      setIsFetching(false);
    }
  }, [t]);

  useEffect(() => {
    if (user?.role === "moderator" || user?.role === "admin") {
      void loadDisputes();
    }
  }, [user, loadDisputes]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!user || !isModeratorUser(user)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Scale className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">{t("moderation.accessTitle")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("moderation.accessText")}
        </p>
        <Button variant="brand" asChild>
          <Link href="/login">{t("auth.logIn")}</Link>
        </Button>
      </div>
    );
  }

  if (!isModerationNavVisible()) {
    return (
      <AppPage title={t("moderation.title")} subtitle={t("moderation.disabledHint")} width="xl">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">{t("common.backToMap")}</Link>
        </Button>
      </AppPage>
    );
  }

  return (
    <AppPage
      title={t("moderation.title")}
      subtitle={t("moderation.subtitle")}
      width="xl"
      actions={
        <Button variant="outline" size="sm" onClick={() => void loadDisputes()}>
          {t("common.refresh")}
        </Button>
      }
    >

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {isFetching ? (
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      ) : disputes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
          {t("moderation.empty")}
        </div>
      ) : (
        <ul className="space-y-3">
          {disputes.map((dispute) => (
            <li key={dispute.id}>
              <Link
                href={`/moderation/disputes/${dispute.id}`}
                className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-brand/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {dispute.order.fileName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dispute.order.customerName} → {dispute.order.makerName}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-foreground/90">
                      {dispute.complaintText}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="font-semibold text-brand">
                      {dispute.order.customerTotalCzk} {t("common.czk")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dispute.evidence.length} {t("moderation.photos")}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}
