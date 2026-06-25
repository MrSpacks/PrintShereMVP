"use client";

import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AuthError } from "@/components/auth/auth-form";
import {
  ORDER_STATUS_KEYS,
  ORDER_STATUS_STYLES,
} from "@/components/orders/order-status-labels";
import { OrderCustomerActions } from "@/components/orders/order-customer-actions";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { getIntlLocale } from "@/i18n/translate";
import { getOrderTotalCzk } from "@/lib/orders/map-order";
import { canEditOrderTerms } from "@/lib/orders/order-workflow";
import type {
  OrderAction,
  OrderMessage,
  OrderResponse,
  PrintQuality,
  UpdateOrderPayload,
} from "@/types/order";
import type { UserRole } from "@/types/user";
import { cn } from "@/lib/utils";

const QUALITY_OPTIONS: PrintQuality[] = ["draft", "standard", "high"];

const QUALITY_KEYS: Record<PrintQuality, string> = {
  draft: "orderDetail.qualityDraft",
  standard: "orderDetail.qualityStandard",
  high: "orderDetail.qualityHigh",
};

interface OrderDetailViewProps {
  orderId: string;
}

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const { t, locale } = useTranslations();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [viewerRole, setViewerRole] = useState<UserRole | null>(null);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [weightGrams, setWeightGrams] = useState("");
  const [printCostCzk, setPrintCostCzk] = useState("");
  const [printQuality, setPrintQuality] = useState<PrintQuality>("standard");
  const [termsMessage, setTermsMessage] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [isSavingTerms, setIsSavingTerms] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadOrder = useCallback(async () => {
    const response = await fetch(`/api/orders/${orderId}`);
    if (response.status === 404) {
      throw new Error(t("orderDetail.notFound"));
    }
    if (!response.ok) {
      throw new Error(t("orderDetail.loadFailed"));
    }
    const data = (await response.json()) as {
      order: OrderResponse;
      viewerRole: UserRole;
    };
    setOrder(data.order);
    setViewerRole(data.viewerRole);
    setWeightGrams(String(data.order.weightGrams));
    setPrintCostCzk(String(data.order.printCostCzk));
    setPrintQuality(data.order.printQuality);
  }, [orderId, t]);

  const loadMessages = useCallback(async () => {
    const response = await fetch(`/api/orders/${orderId}/messages`);
    if (!response.ok) return;
    const data = (await response.json()) as { messages: OrderMessage[] };
    setMessages(data.messages);
  }, [orderId]);

  const markAsRead = useCallback(async () => {
    await fetch(`/api/orders/${orderId}/read`, { method: "POST" });
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      setError(null);
      try {
        await loadOrder();
        await loadMessages();
        await markAsRead();
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("orderDetail.loadFailed")
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void init();

    const interval = setInterval(() => {
      void loadMessages();
      void markAsRead();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadOrder, loadMessages, markAsRead, t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const patchOrder = async (payload: UpdateOrderPayload) => {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      order?: OrderResponse;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? t("orderDetail.loadFailed"));
    }
    if (data.order) {
      setOrder(data.order);
      setWeightGrams(String(data.order.weightGrams));
      setPrintCostCzk(String(data.order.printCostCzk));
      setPrintQuality(data.order.printQuality);
    }
  };

  const handleSaveTerms = async (event: React.FormEvent) => {
    event.preventDefault();
    setTermsError(null);
    setTermsMessage(null);
    setIsSavingTerms(true);

    try {
      await patchOrder({
        weightGrams: Number(weightGrams),
        printCostCzk: Number(printCostCzk),
        printQuality,
      });
      setTermsMessage(t("orderDetail.termsSaved"));
    } catch (saveError) {
      setTermsError(
        saveError instanceof Error ? saveError.message : t("orderDetail.loadFailed")
      );
    } finally {
      setIsSavingTerms(false);
    }
  };

  const handleAction = async (action: OrderAction) => {
    setTermsError(null);
    setTermsMessage(null);
    setIsUpdatingStatus(true);

    try {
      await patchOrder({ action });
      const successKeys: Partial<Record<OrderAction, string>> = {
        propose_terms: "orderDetail.proposeSuccess",
        accept_terms: "orderDetail.acceptSuccess",
        pay: "orderDetail.paySuccess",
        start_printing: "orderDetail.printingSuccess",
        mark_shipped: "orderDetail.shippedSuccess",
        confirm_receipt: "orderDetail.receiptSuccess",
        cancel: "orderDetail.cancelSuccess",
      };
      const key = successKeys[action];
      if (key) setTermsMessage(t(key));
    } catch (statusError) {
      setTermsError(
        statusError instanceof Error
          ? statusError.message
          : t("orderDetail.loadFailed")
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = chatInput.trim();
    if (!body) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = (await response.json()) as {
        message?: OrderMessage;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed");
      }
      if (data.message) {
        setMessages((current) => [...current, data.message!]);
      }
      setChatInput("");
    } catch {
      setTermsError(t("orderDetail.loadFailed"));
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        {error ?? t("orderDetail.notFound")}
        <div className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/orders">{t("orderDetail.back")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isMaker = viewerRole === "maker";
  const isCustomer = viewerRole === "customer";
  const canEditTerms = canEditOrderTerms(order.status);
  const total = getOrderTotalCzk(order);
  const displayPrintCzk = isMaker ? order.printCostCzk : order.customerPrintCzk;
  const formattedDate = new Intl.DateTimeFormat(getIntlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(order.createdAt));

  const chatParty = isMaker
    ? t("orderDetail.chatPartyCustomer")
    : t("orderDetail.chatPartyMaker");

  return (
    <div className="space-y-6">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("orderDetail.back")}
      </Link>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h1 className="truncate text-lg font-semibold">{order.fileName}</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isMaker
                ? order.customerName
                  ? t("orderDetail.withCustomer", { name: order.customerName })
                  : t("orderDetail.guestCustomer")
                : t("orderDetail.withMaker", { name: order.makerName })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("orders.ordered", {
                date: formattedDate,
                id: order.id.slice(-8),
              })}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              ORDER_STATUS_STYLES[order.status]
            )}
          >
            {t(ORDER_STATUS_KEYS[order.status])}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">{t("orderDetail.dimensions")}</dt>
            <dd className="font-medium">
              {order.widthMm} × {order.heightMm} × {order.depthMm} mm
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("orders.deliveryLabel")}</dt>
            <dd className="font-medium">
              {order.deliveryMethod === "zasilkovna" ? (
                <span>
                  Zásilkovna {order.deliveryPriceCzk} {t("common.czk")}
                  {order.zasilkovnaPointLabel && (
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      {order.zasilkovnaPointLabel}
                    </span>
                  )}
                </span>
              ) : (
                t("orders.pickup")
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {isMaker ? t("orderDetail.makerPrint") : t("orders.print")}
            </dt>
            <dd className="font-medium">
              {displayPrintCzk} {t("common.czk")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("orders.total")}</dt>
            <dd className="font-semibold text-brand">
              {total} {t("common.czk")}
            </dd>
          </div>
        </dl>

        {isMaker && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4 text-sm">
            {order.fileUrl ? (
              <a
                href={order.fileUrl}
                className="font-medium text-brand hover:underline"
              >
                {t("orderDetail.downloadModel")}
              </a>
            ) : (
              <span className="text-muted-foreground">
                {t("orderDetail.fileMissing")}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">{t("orderDetail.termsTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("orderDetail.termsSubtitle")}
          </p>

          <form onSubmit={(e) => void handleSaveTerms(e)} className="mt-4 space-y-4">
            <AuthError message={termsError} />
            {termsMessage && (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {termsMessage}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="weight" className="text-sm font-medium">
                  {t("orders.weight")} (g)
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  disabled={!canEditTerms}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">
                  {t("orders.print")} ({t("common.czk")})
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  value={printCostCzk}
                  onChange={(e) => setPrintCostCzk(e.target.value)}
                  disabled={!canEditTerms}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="quality" className="text-sm font-medium">
                {t("orderDetail.quality")}
              </label>
              <select
                id="quality"
                value={printQuality}
                onChange={(e) =>
                  setPrintQuality(e.target.value as PrintQuality)
                }
                disabled={!canEditTerms}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
              >
                {QUALITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {t(QUALITY_KEYS[option])}
                  </option>
                ))}
              </select>
            </div>

            {canEditTerms ? (
              <Button type="submit" variant="brand" disabled={isSavingTerms}>
                {isSavingTerms ? t("common.saving") : t("orderDetail.saveTerms")}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("orderDetail.termsLocked")}
              </p>
            )}
          </form>

          {order.status === "awaiting_payment" && isCustomer && (
            <div className="mt-4 rounded-md border border-violet-200 bg-violet-50 px-3 py-3 text-sm text-violet-900">
              <p>{t("orderDetail.payHint")}</p>
              <Button
                type="button"
                variant="brand"
                className="mt-3"
                disabled={isUpdatingStatus}
                onClick={() => void handleAction("pay")}
              >
                {t("orderDetail.payOrder")}
              </Button>
            </div>
          )}

          {isMaker && (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
              {order.status === "pending" && (
                <Button
                  type="button"
                  variant="brand"
                  disabled={isUpdatingStatus}
                  onClick={() => void handleAction("propose_terms")}
                >
                  {t("orderDetail.proposeTerms")}
                </Button>
              )}
              {order.status === "paid" && (
                <Button
                  type="button"
                  variant="brand"
                  disabled={isUpdatingStatus}
                  onClick={() => void handleAction("start_printing")}
                >
                  {t("orderDetail.startPrinting")}
                </Button>
              )}
              {order.status === "printing" && (
                <Button
                  type="button"
                  variant="brand"
                  disabled={isUpdatingStatus}
                  onClick={() => void handleAction("mark_shipped")}
                >
                  {t("orderDetail.markShipped")}
                </Button>
              )}
              {["pending", "awaiting_customer", "awaiting_payment", "paid"].includes(
                order.status
              ) && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdatingStatus}
                  onClick={() => void handleAction("cancel")}
                >
                  {t("orderDetail.cancelOrder")}
                </Button>
              )}
            </div>
          )}

          {isCustomer && order.status === "awaiting_customer" && (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="brand"
                disabled={isUpdatingStatus}
                onClick={() => void handleAction("accept_terms")}
              >
                {t("orderDetail.acceptTerms")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isUpdatingStatus}
                onClick={() => void handleAction("cancel")}
              >
                {t("orderDetail.cancelOrder")}
              </Button>
            </div>
          )}

          {isCustomer &&
            ["pending", "awaiting_payment"].includes(order.status) &&
            order.status !== "awaiting_customer" && (
            <div className="mt-6 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={isUpdatingStatus}
                onClick={() => void handleAction("cancel")}
              >
                {t("orderDetail.cancelOrder")}
              </Button>
            </div>
          )}
        </section>

        <section className="flex min-h-[320px] flex-col rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">{t("orderDetail.chatTitle")}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("orderDetail.chatSubtitle", { party: chatParty })}
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {t("orderDetail.chatEmpty")}
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  message.isOwn
                    ? "ml-auto bg-brand text-brand-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p className="text-xs font-semibold opacity-80">
                  {message.senderName}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words">
                  {message.body}
                </p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={(e) => void handleSendMessage(e)}
            className="flex gap-2 border-t border-border p-4"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t("orderDetail.chatPlaceholder")}
              maxLength={2000}
              className="flex h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
            />
            <Button type="submit" variant="brand" disabled={isSending || !chatInput.trim()}>
              {isSending ? t("common.pleaseWait") : t("orderDetail.chatSend")}
            </Button>
          </form>
        </section>
      </div>

      {isCustomer && (
        <OrderCustomerActions
          order={order}
          isUpdating={isUpdatingStatus}
          onAction={handleAction}
          onOrderUpdated={setOrder}
        />
      )}
    </div>
  );
}
