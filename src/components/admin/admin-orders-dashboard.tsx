"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { AdminShell, formatAdminMoney } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { getIntlLocale } from "@/i18n/translate";
import {
  ORDER_STATUS_KEYS,
  ORDER_STATUS_STYLES,
} from "@/components/orders/order-status-labels";
import type { AdminOrderSummary } from "@/types/admin";
import type { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_OPTIONS: Array<OrderStatus | "all"> = [
  "all",
  "pending",
  "awaiting_customer",
  "awaiting_payment",
  "paid",
  "printing",
  "shipped",
  "delivered",
  "completed",
  "disputed",
  "refunded",
  "cancelled",
];

interface AdminOrdersResponse {
  orders: AdminOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function AdminOrdersDashboard() {
  const { t, locale } = useTranslations();
  const intlLocale = getIntlLocale(locale);

  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadOrders = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!response.ok) throw new Error("Failed");

      const data = (await response.json()) as AdminOrdersResponse;
      setOrders(data.orders);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      setError(t("admin.ordersLoadFailed"));
    } finally {
      setIsFetching(false);
    }
  }, [debouncedSearch, statusFilter, page, t]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, total);
  const hasActiveFilters =
    debouncedSearch.length > 0 || statusFilter !== "all";

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  return (
    <AdminShell
      title={t("admin.ordersTitle")}
      subtitle={t("admin.ordersSubtitle")}
      actions={
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => void loadOrders()}
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t("admin.ordersSearchPlaceholder")}
            className="flex h-10 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as OrderStatus | "all");
            setPage(1);
          }}
          className="flex h-10 min-w-[180px] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("admin.filterStatus")}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === "all"
                ? t("admin.statusAll")
                : t(ORDER_STATUS_KEYS[status])}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  {t("admin.columnOrder")}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  {t("admin.columnCustomer")}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  {t("admin.columnMaker")}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  {t("admin.columnStatus")}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  {t("admin.columnAmount")}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  {t("admin.columnFee")}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  {t("admin.columnDate")}
                </th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                Array.from({ length: 5 }, (_, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-5 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    {hasActiveFilters
                      ? t("admin.ordersNoResults")
                      : t("admin.ordersEmpty")}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-brand hover:underline"
                      >
                        <span className="block max-w-[180px] truncate">
                          {order.fileName}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                          {order.id.slice(0, 8)}…
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {order.customerName ?? t("admin.guestCustomer")}
                      </p>
                      {order.customerEmail ? (
                        <p className="text-xs text-muted-foreground">
                          {order.customerEmail}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.makerName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          ORDER_STATUS_STYLES[order.status]
                        )}
                      >
                        {t(ORDER_STATUS_KEYS[order.status])}
                      </span>
                      {order.disputeOpen ? (
                        <span className="mt-1 block text-xs font-medium text-red-600">
                          {t("admin.disputeOpenBadge")}
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums">
                      {formatAdminMoney(order.customerTotalCzk, t)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-brand">
                      {formatAdminMoney(order.platformFeeCzk, t)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isFetching && total > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t("admin.showing", {
                from: rangeFrom,
                to: rangeTo,
                total,
              })}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                aria-label={t("admin.prevPage")}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
              <span className="min-w-[120px] text-center text-sm text-muted-foreground">
                {t("admin.pageOf", { page, totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                aria-label={t("admin.nextPage")}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
