"use client";

import { useRef, useState } from "react";
import { Star } from "lucide-react";

import { AuthError } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { resizeImageToDataUrl } from "@/lib/users/resize-avatar";
import {
  canConfirmReceipt,
  canOpenDispute,
  canSubmitReview,
} from "@/lib/orders/order-workflow";
import type { OrderResponse } from "@/types/order";
import { cn } from "@/lib/utils";

interface OrderCustomerActionsProps {
  order: OrderResponse;
  onOrderUpdated: (order: OrderResponse) => void;
  onAction: (action: "confirm_receipt") => Promise<void>;
  isUpdating: boolean;
}

export function OrderCustomerActions({
  order,
  onOrderUpdated,
  onAction,
  isUpdating,
}: OrderCustomerActionsProps) {
  const { t } = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [isOpeningDispute, setIsOpeningDispute] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showReceipt = canConfirmReceipt(order.status);
  const showReview = canSubmitReview(order.status) && !order.review;
  const showDispute =
    canOpenDispute(order.status) && !order.dispute && order.status !== "disputed";
  const hasDispute = Boolean(order.dispute);

  if (!showReceipt && !showReview && !showDispute && !order.review && !hasDispute) {
    return null;
  }

  const handleReview = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmittingReview(true);

    try {
      const response = await fetch(`/api/orders/${order.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      const data = (await response.json()) as {
        order?: OrderResponse;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? t("orderDetail.reviewFailed"));
      if (data.order) onOrderUpdated(data.order);
      setSuccess(t("orderDetail.reviewSuccess"));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t("orderDetail.reviewFailed")
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDispute = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsOpeningDispute(true);

    try {
      const response = await fetch(`/api/orders/${order.id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintText,
          evidenceUrls,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? t("orderDetail.disputeFailed"));

      const orderResponse = await fetch(`/api/orders/${order.id}`);
      const orderData = (await orderResponse.json()) as { order: OrderResponse };
      onOrderUpdated(orderData.order);
      setShowDisputeForm(false);
      setSuccess(t("orderDetail.disputeOpened"));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t("orderDetail.disputeFailed")
      );
    } finally {
      setIsOpeningDispute(false);
    }
  };

  const handleEvidence = async (file: File | undefined) => {
    if (!file || evidenceUrls.length >= 3) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setEvidenceUrls((current) => [...current, dataUrl]);
    } catch {
      setError(t("orderDetail.evidenceInvalid"));
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">{t("orderDetail.completionTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("orderDetail.completionSubtitle")}
      </p>

      <AuthError message={error} />
      {success && (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </p>
      )}

      {showReceipt && (
        <div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-4">
          <p className="text-sm text-foreground">{t("orderDetail.confirmReceiptHint")}</p>
          <Button
            type="button"
            variant="brand"
            className="mt-3"
            disabled={isUpdating}
            onClick={() => void onAction("confirm_receipt")}
          >
            {t("orderDetail.confirmReceipt")}
          </Button>
        </div>
      )}

      {order.review && (
        <div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-4 text-sm">
          <p className="font-medium">{t("orderDetail.yourReview")}</p>
          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={cn(
                  "h-4 w-4",
                  index < order.review!.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                )}
              />
            ))}
          </div>
          {order.review.comment && (
            <p className="mt-2 text-muted-foreground">{order.review.comment}</p>
          )}
        </div>
      )}

      {showReview && (
        <form onSubmit={(e) => void handleReview(e)} className="mt-4 space-y-3">
          <p className="text-sm font-medium">{t("orderDetail.leaveReview")}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded p-0.5"
                aria-label={`${value}`}
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    value <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            placeholder={t("orderDetail.reviewPlaceholder")}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button type="submit" variant="brand" disabled={isSubmittingReview}>
            {isSubmittingReview ? t("common.saving") : t("orderDetail.submitReview")}
          </Button>
        </form>
      )}

      {hasDispute && order.dispute && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">{t("orderDetail.disputeOpen")}</p>
          <p className="mt-1">{order.dispute.complaintText}</p>
          {order.dispute.resolutionText && (
            <p className="mt-2">
              <span className="font-medium">{t("orderDetail.disputeResolution")}: </span>
              {order.dispute.resolutionText}
            </p>
          )}
        </div>
      )}

      {showDispute && !showDisputeForm && (
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => setShowDisputeForm(true)}
        >
          {t("orderDetail.openDispute")}
        </Button>
      )}

      {showDispute && showDisputeForm && (
        <form onSubmit={(e) => void handleDispute(e)} className="mt-4 space-y-3">
          <p className="text-sm font-medium">{t("orderDetail.disputeTitle")}</p>
          <textarea
            value={complaintText}
            onChange={(event) => setComplaintText(event.target.value)}
            rows={4}
            required
            minLength={10}
            placeholder={t("orderDetail.disputePlaceholder")}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                void handleEvidence(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={evidenceUrls.length >= 3}
              onClick={() => fileRef.current?.click()}
            >
              {t("orderDetail.addEvidence")} ({evidenceUrls.length}/3)
            </Button>
            {evidenceUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {evidenceUrls.map((url, index) => (
                  <div key={url.slice(0, 32)} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="h-16 w-16 rounded-md border object-cover"
                    />
                    <button
                      type="button"
                      className="absolute -right-1 -top-1 rounded-full bg-background px-1 text-xs shadow"
                      onClick={() =>
                        setEvidenceUrls((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={isOpeningDispute}>
              {isOpeningDispute ? t("common.saving") : t("orderDetail.submitDispute")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDisputeForm(false)}
            >
              {t("common.close")}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
