"use client";

import Link from "next/link";
import { useState } from "react";

import { OrderCard, OrdersEmptyState } from "@/components/orders/order-card";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/use-orders";
import { useTranslations } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { hasMakerAccess, type OrdersListView } from "@/types/user";

const LIST_VIEWS: OrdersListView[] = ["customer", "maker"];

export default function OrdersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [listView, setListView] = useState<OrdersListView>("customer");
  const canViewMaker = Boolean(user && hasMakerAccess(user));
  const { orders, view, isLoading, error, refetch } = useOrders(
    Boolean(user),
    listView
  );
  const { t } = useTranslations();

  const activeView = view ?? listView;
  const cardRole = activeView === "maker" ? "maker" : "customer";

  const pageMeta: Record<
    OrdersListView,
    { title: string; subtitle: string }
  > = {
    customer: {
      title: t("orders.title"),
      subtitle: t("orders.subtitleCustomer"),
    },
    maker: {
      title: t("orders.titleMaker"),
      subtitle: t("orders.subtitleMaker"),
    },
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">{t("orders.title")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("orders.loginText")}
        </p>
        <Button variant="brand" asChild>
          <Link href="/login">{t("auth.logIn")}</Link>
        </Button>
      </div>
    );
  }

  const { title, subtitle } = pageMeta[activeView];

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <Button variant="outline" size="sm" onClick={refetch}>
          {t("common.refresh")}
        </Button>
      </div>

      {canViewMaker && (
        <div
          className="mb-6 inline-flex rounded-lg border border-border bg-muted/40 p-1"
          role="tablist"
          aria-label={t("orders.title")}
        >
          {LIST_VIEWS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={listView === tab}
              onClick={() => setListView(tab)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                listView === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "customer"
                ? t("orders.tabCustomer")
                : t("orders.tabMaker")}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((key) => (
            <div
              key={key}
              className="h-36 animate-pulse rounded-xl bg-muted"
              aria-hidden
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <OrdersEmptyState role={cardRole} />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} view={cardRole} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
