"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";
import { getIntlLocale } from "@/i18n/translate";
import type { User, UserRole } from "@/types/user";

const ROLE_OPTIONS: UserRole[] = ["customer", "maker", "moderator", "admin"];
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type RoleFilter = "all" | UserRole;

interface AdminUsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function roleOptionsForUser(entry: User): UserRole[] {
  if (entry.makerId) return ROLE_OPTIONS;
  return ROLE_OPTIONS.filter((role) => role !== "maker");
}

function formatRegisteredAt(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function AdminUsersDashboard() {
  const { user, isLoading } = useAuth();
  const { t, locale } = useTranslations();
  const intlLocale = getIntlLocale(locale);

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, UserRole>>({});

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (roleFilter !== "all") params.set("role", roleFilter);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      params.set("sort", "createdAt:desc");

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) throw new Error("Failed");

      const data = (await response.json()) as AdminUsersResponse;
      setUsers(data.users);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setPendingRoles((current) => {
        const next = { ...current };
        for (const entry of data.users) {
          next[entry.id] = entry.role;
        }
        return next;
      });
    } catch {
      setError(t("admin.loadFailed"));
    } finally {
      setIsFetching(false);
    }
  }, [debouncedSearch, roleFilter, page, t]);

  useEffect(() => {
    if (user?.role === "admin") {
      void loadUsers();
    }
  }, [user, loadUsers]);

  async function saveRole(userId: string) {
    const role = pendingRoles[userId];
    if (!role) return;

    setSavingId(userId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed");
      }

      const data = (await response.json()) as { user: User };
      setUsers((current) =>
        current.map((entry) => (entry.id === userId ? data.user : entry))
      );
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : t("admin.saveFailed");
      setError(message);
    } finally {
      setSavingId(null);
    }
  }

  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, total);
  const hasActiveFilters = debouncedSearch.length > 0 || roleFilter !== "all";

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Shield className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">{t("admin.accessTitle")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("admin.accessText")}
        </p>
        <Button variant="brand" asChild>
          <Link href="/login">{t("auth.logIn")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("admin.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.subtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => void loadUsers()}
        >
          {t("common.refresh")}
        </Button>
      </div>

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
            placeholder={t("admin.searchPlaceholder")}
            className="flex h-10 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value as RoleFilter);
            setPage(1);
          }}
          className="flex h-10 min-w-[160px] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("admin.filterRole")}
        >
          <option value="all">{t("admin.roleAll")}</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  {t("admin.columnName")}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  {t("admin.columnEmail")}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  {t("admin.columnRegistered")}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  {t("admin.columnRole")}
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  <span className="sr-only">{t("admin.columnActions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                Array.from({ length: 5 }, (_, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-5 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    {hasActiveFilters ? t("admin.searchNoResults") : t("admin.empty")}
                  </td>
                </tr>
              ) : (
                users.map((entry) => {
                  const isSelf = entry.id === user.id;
                  const pendingRole = pendingRoles[entry.id] ?? entry.role;
                  const hasChanges = pendingRole !== entry.role;

                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{entry.name}</p>
                        {isSelf && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t("admin.selfRoleHint")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {entry.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatRegisteredAt(entry.createdAt, intlLocale)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={pendingRole}
                          disabled={isSelf || savingId === entry.id}
                          onChange={(event) =>
                            setPendingRoles((current) => ({
                              ...current,
                              [entry.id]: event.target.value as UserRole,
                            }))
                          }
                          className="flex h-9 min-w-[130px] rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                          aria-label={t("admin.roleLabel")}
                        >
                          {roleOptionsForUser(entry).map((role) => (
                            <option key={role} value={role}>
                              {t(`roles.${role}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="brand"
                          disabled={isSelf || !hasChanges || savingId === entry.id}
                          onClick={() => void saveRole(entry.id)}
                        >
                          {savingId === entry.id
                            ? t("common.loading")
                            : t("admin.saveRole")}
                        </Button>
                      </td>
                    </tr>
                  );
                })
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
                disabled={page <= 1 || isFetching}
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
                disabled={page >= totalPages || isFetching}
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
    </div>
  );
}
