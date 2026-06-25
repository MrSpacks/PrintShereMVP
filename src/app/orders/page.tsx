"use client";

import Link from "next/link";

import { OrderCard, OrdersEmptyState } from "@/components/orders/order-card";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/use-orders";
import { useTranslations } from "@/i18n/locale-provider";
import type { UserRole } from "@/types/user";

export default function OrdersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { orders, role, isLoading, error, refetch } = useOrders(Boolean(user));
  const { t } = useTranslations();

  const pageMeta: Record<UserRole, { title: string; subtitle: string }> = {
    customer: {
      title: t("orders.title"),
      subtitle: t("orders.subtitleCustomer"),
    },
    maker: {
      title: t("orders.titleMaker"),
      subtitle: t("orders.subtitleMaker"),
    },
    admin: {
      title: t("orders.titleAdmin"),
      subtitle: t("orders.subtitleAdmin"),
    },
    moderator: {
      title: t("orders.titleModerator"),
      subtitle: t("orders.subtitleModerator"),
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

  const pageMetaForRole = pageMeta[user.role];
  const listRole = role ?? user.role;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {pageMetaForRole.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pageMetaForRole.subtitle}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={refetch}>
          {t("common.refresh")}
        </Button>
      </div>

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
        <OrdersEmptyState role={listRole} />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} view={listRole} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
