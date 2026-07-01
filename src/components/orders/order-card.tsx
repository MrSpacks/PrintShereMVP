"use client";

import Link from "next/link";
import { Package } from "lucide-react";

import {
  ORDER_STATUS_KEYS,
  ORDER_STATUS_STYLES,
} from "@/components/orders/order-status-labels";
import { getMakerPayoutCzk } from "@/lib/orders/map-order";
import {
  formatCustomerDeliveryLabel,
  formatMakerDeliveryLabel,
} from "@/lib/orders/format-order-delivery";
import { useTranslations } from "@/i18n/locale-provider";
import type { OrderResponse } from "@/types/order";
import { cn } from "@/lib/utils";

import type { UserRole } from "@/types/user";

interface OrderCardProps {
  order: OrderResponse;
  view: UserRole;
}

export function OrderCard({ order, view }: OrderCardProps) {
  const { t } = useTranslations();
  const isMaker = view === "maker";
  const payout = isMaker
    ? getMakerPayoutCzk(order)
    : (order.customerTotalCzk ?? order.printCostCzk);
  const printLabel = isMaker ? order.printCostCzk : order.customerPrintCzk;
  const printHeading = isMaker ? t("orderDetail.makerPrint") : t("orders.print");

  const deliveryLabels = {
    pickup: t("orders.pickup"),
    zasilkovna: t("map.zasilkovna"),
    czk: t("common.czk"),
  };
  const deliveryLabel = isMaker
    ? formatMakerDeliveryLabel(order, deliveryLabels)
    : formatCustomerDeliveryLabel(order, deliveryLabels);
  const deliveryHeading = isMaker
    ? t("orders.deliveryMethod")
    : t("orders.deliveryLabel");

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <article className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-brand/40 hover:bg-muted/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
              <h2 className="truncate text-sm font-semibold text-foreground">
                {order.fileName}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {view === "maker"
                ? (order.customerName ?? t("orderDetail.guestCustomer"))
                : order.makerName}
            </p>
          </div>

          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              ORDER_STATUS_STYLES[order.status]
            )}
          >
            {t(ORDER_STATUS_KEYS[order.status])}
          </span>
        </div>

        <dl
          className={cn(
            "mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm",
            isMaker ? "sm:grid-cols-3" : "sm:grid-cols-4"
          )}
        >
          <div>
            <dt className="text-xs text-muted-foreground">{t("orders.weight")}</dt>
            <dd className="font-medium">
              {order.weightGrams}g ·{" "}
              {order.printerType === "fdm"
                ? t("printer.plastic")
                : t("printer.resinShort")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{printHeading}</dt>
            <dd className="font-medium">
              {printLabel} {t("common.czk")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{deliveryHeading}</dt>
            <dd className="font-medium">{deliveryLabel}</dd>
          </div>
          {!isMaker && (
            <div>
              <dt className="text-xs text-muted-foreground">{t("orders.total")}</dt>
              <dd className="font-semibold text-brand">
                {payout} {t("common.czk")}
              </dd>
            </div>
          )}
        </dl>

        <p className="mt-3 text-xs font-medium text-brand">
          {t("orders.openOrder")} →
        </p>
      </article>
    </Link>
  );
}

interface OrdersEmptyStateProps {
  role: UserRole;
}

export function OrdersEmptyState({ role }: OrdersEmptyStateProps) {
  const { t } = useTranslations();

  const message =
    role === "maker"
      ? t("orders.emptyMaker")
      : role === "moderator"
        ? t("orders.emptyModerator")
        : role === "admin"
          ? t("orders.emptyAdmin")
          : t("orders.emptyCustomer");

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <Package className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      {role === "moderator" && (
        <Link
          href="/moderation"
          className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
        >
          {t("auth.moderation")} →
        </Link>
      )}
      {role === "customer" && (
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
        >
          {t("common.goToMap")}
        </Link>
      )}
    </div>
  );
}
