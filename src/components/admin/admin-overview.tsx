"use client";

import { useCallback, useEffect, useState } from "react";

import {
  AdminShell,
  AdminStatCard,
  formatAdminMoney,
} from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { ORDER_STATUS_KEYS, ORDER_STATUS_STYLES } from "@/components/orders/order-status-labels";
import type { AdminPlatformStats } from "@/types/admin";
import type { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

export function AdminOverview() {
  const { t } = useTranslations();
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const loadStats = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed");
      const data = (await response.json()) as { stats: AdminPlatformStats };
      setStats(data.stats);
    } catch {
      setError(t("admin.statsLoadFailed"));
    } finally {
      setIsFetching(false);
    }
  }, [t]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <AdminShell
      title={t("admin.overviewTitle")}
      subtitle={t("admin.overviewSubtitle")}
      actions={
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => void loadStats()}
        >
          {t("common.refresh")}
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isFetching && !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-muted"
              aria-hidden
            />
          ))}
        </div>
      ) : stats ? (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              label={t("admin.statTotalOrders")}
              value={String(stats.totalOrders)}
              hint={t("admin.statOrdersLast7", { count: stats.ordersLast7Days })}
            />
            <AdminStatCard
              label={t("admin.statActiveOrders")}
              value={String(stats.activeOrders)}
              hint={t("admin.statOpenDisputes", { count: stats.openDisputes })}
            />
            <AdminStatCard
              label={t("admin.statCompletedOrders")}
              value={String(stats.completedOrders)}
            />
            <AdminStatCard
              label={t("admin.statCustomers")}
              value={String(stats.uniqueCustomers)}
              hint={t("admin.statMakers", { count: stats.makersWithOrders })}
            />
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">
              {t("admin.revenueTitle")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AdminStatCard
                label={t("admin.statGmvNet")}
                value={formatAdminMoney(stats.revenue.gmvNetCzk, t)}
                hint={t("admin.statGmvNetHint")}
              />
              <AdminStatCard
                label={t("admin.statGmvCompleted")}
                value={formatAdminMoney(stats.revenue.gmvCompletedCzk, t)}
              />
              <AdminStatCard
                label={t("admin.statGmvInProgress")}
                value={formatAdminMoney(stats.revenue.gmvInProgressCzk, t)}
              />
              <AdminStatCard
                label={t("admin.statPlatformFeesNet")}
                value={formatAdminMoney(stats.revenue.platformFeesNetCzk, t)}
                accent
                hint={t("admin.statPlatformFeesCompleted", {
                  amount: formatAdminMoney(
                    stats.revenue.platformFeesCompletedCzk,
                    t
                  ),
                })}
              />
              <AdminStatCard
                label={t("admin.statNetPlatformRevenue")}
                value={formatAdminMoney(
                  stats.revenue.netPlatformRevenueCzk,
                  t
                )}
                accent
                hint={t("admin.statNetPlatformRevenueHint")}
              />
              <AdminStatCard
                label={t("admin.statMakerEarnings")}
                value={formatAdminMoney(
                  stats.revenue.makerEarningsCompletedCzk,
                  t
                )}
              />
              <AdminStatCard
                label={t("admin.statRefunded")}
                value={formatAdminMoney(
                  stats.revenue.refundedToCustomersCzk,
                  t
                )}
                hint={t("admin.statRefundedHint", {
                  platform: formatAdminMoney(
                    stats.revenue.refundedPlatformFeesCzk,
                    t
                  ),
                  stripe: formatAdminMoney(
                    stats.revenue.stripeRefundFeesCzk,
                    t
                  ),
                })}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">
              {t("admin.statusBreakdownTitle")}
            </h2>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        {t("admin.columnStatus")}
                      </th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        {t("admin.columnCount")}
                      </th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        {t("admin.columnAmount")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byStatus
                      .filter((row) => row.count > 0)
                      .map((row) => (
                        <tr
                          key={row.status}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                                ORDER_STATUS_STYLES[row.status as OrderStatus]
                              )}
                            >
                              {t(ORDER_STATUS_KEYS[row.status as OrderStatus])}
                            </span>
                          </td>
                          <td className="px-4 py-3 tabular-nums">{row.count}</td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatAdminMoney(row.totalCzk, t)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">
              {t("admin.stripeTitle")}
            </h2>
            <div
              className={cn(
                "rounded-xl border px-4 py-4",
                stats.stripe.connected
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              )}
            >
              <p className="text-sm font-medium text-foreground">
                {stats.stripe.connected
                  ? t("admin.stripeConnected")
                  : t("admin.stripeNotConnected")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stats.stripe.connected
                  ? t("admin.stripeConnectedHint")
                  : t("admin.stripeNotConnectedHint")}
              </p>
              {stats.stripe.connected ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <AdminStatCard
                    label={t("admin.stripeCaptured")}
                    value={formatAdminMoney(
                      stats.stripe.paymentsCapturedCzk,
                      t
                    )}
                  />
                  <AdminStatCard
                    label={t("admin.stripeEscrow")}
                    value={formatAdminMoney(stats.stripe.escrowHeldCzk, t)}
                  />
                  <AdminStatCard
                    label={t("admin.stripePayouts")}
                    value={formatAdminMoney(
                      stats.stripe.pendingPayoutsCzk,
                      t
                    )}
                  />
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}
