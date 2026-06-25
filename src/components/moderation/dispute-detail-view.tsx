"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { AuthError } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import type { DisputeResolution, DisputeSummary } from "@/types/dispute";
import type { OrderResponse } from "@/types/order";

interface DisputeDetailViewProps {
  disputeId: string;
}

export function DisputeDetailView({ disputeId }: DisputeDetailViewProps) {
  const router = useRouter();
  const { t } = useTranslations();
  const [dispute, setDispute] = useState<DisputeSummary | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<DisputeResolution>("refund");
  const [resolutionText, setResolutionText] = useState("");
  const [refundAmountCzk, setRefundAmountCzk] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const loadDispute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/moderation/disputes/${disputeId}`);
      if (!response.ok) throw new Error(t("moderation.loadFailed"));
      const data = (await response.json()) as {
        dispute: DisputeSummary;
        order: OrderResponse;
      };
      setDispute(data.dispute);
      setOrder(data.order);
      setRefundAmountCzk(String(data.order.customerTotalCzk));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : t("moderation.loadFailed")
      );
    } finally {
      setIsLoading(false);
    }
  }, [disputeId, t]);

  useEffect(() => {
    void loadDispute();
  }, [loadDispute]);

  const handleResolve = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/moderation/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution,
          resolutionText,
          refundAmountCzk:
            resolution === "refund" ? Number(refundAmountCzk) : undefined,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? t("moderation.resolveFailed"));

      setSuccess(t("moderation.resolveSuccess"));
      setTimeout(() => router.push("/moderation"), 1200);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t("moderation.resolveFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (error && !dispute) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!dispute || !order) return null;

  const isOpen = dispute.status === "open";

  return (
    <div className="space-y-6">
      <Link
        href="/moderation"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("moderation.back")}
      </Link>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h1 className="text-lg font-semibold">{order.fileName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dispute.openedByName} · {order.customerTotalCzk} {t("common.czk")}
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <h2 className="text-sm font-medium">{t("moderation.complaint")}</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
              {dispute.complaintText}
            </p>
          </div>

          {dispute.evidence.length > 0 && (
            <div>
              <h2 className="text-sm font-medium">{t("moderation.evidence")}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {dispute.evidence.map((item) => (
                  <a
                    key={item.id}
                    href={item.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-24 w-24 rounded-md border object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isOpen ? (
        <form
          onSubmit={(e) => void handleResolve(e)}
          className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4"
        >
          <h2 className="text-base font-semibold">{t("moderation.resolveTitle")}</h2>
          <AuthError message={error} />
          {success && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {success}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={resolution === "refund" ? "brand" : "outline"}
              size="sm"
              onClick={() => setResolution("refund")}
            >
              {t("moderation.refund")}
            </Button>
            <Button
              type="button"
              variant={resolution === "rejected" ? "brand" : "outline"}
              size="sm"
              onClick={() => setResolution("rejected")}
            >
              {t("moderation.reject")}
            </Button>
          </div>

          {resolution === "refund" && (
            <div className="space-y-2">
              <label htmlFor="refund-amount" className="text-sm font-medium">
                {t("moderation.refundAmount")}
              </label>
              <input
                id="refund-amount"
                type="number"
                min="1"
                value={refundAmountCzk}
                onChange={(event) => setRefundAmountCzk(event.target.value)}
                className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {t("moderation.refundHint")}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="resolution-text" className="text-sm font-medium">
              {t("moderation.resolutionText")}
            </label>
            <textarea
              id="resolution-text"
              value={resolutionText}
              onChange={(event) => setResolutionText(event.target.value)}
              rows={4}
              required
              minLength={5}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t("moderation.resolutionPlaceholder")}
            />
          </div>

          <Button type="submit" variant="brand" disabled={isSubmitting}>
            {isSubmitting ? t("common.saving") : t("moderation.submitResolution")}
          </Button>
        </form>
      ) : (
        <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm">
          <p className="font-medium">{t("moderation.alreadyResolved")}</p>
          {dispute.resolutionText && (
            <p className="mt-2 text-muted-foreground">{dispute.resolutionText}</p>
          )}
        </div>
      )}
    </div>
  );
}
