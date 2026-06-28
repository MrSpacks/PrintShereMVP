"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { UserAvatar } from "@/components/profile/user-profile-view";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";
import { getIntlLocale } from "@/i18n/translate";
import { ADMIN_BLOCK_DAY_OPTIONS } from "@/lib/users/user-block";
import type { StaffRole, User } from "@/types/user";
import { getUserCapabilityLabels } from "@/types/user";
import { cn } from "@/lib/utils";

const STAFF_OPTIONS: Array<StaffRole | ""> = ["", "moderator", "admin"];
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type RoleFilter = "all" | "customer" | "maker" | StaffRole;

interface AdminUsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function staffRoleForUser(entry: User): StaffRole | "" {
  return entry.staffRole ?? "";
}

function formatRegisteredAt(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function AdminUsersDashboard() {
  const { user } = useAuth();
  const { t, locale } = useTranslations();
  const intlLocale = getIntlLocale(locale);

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingStaffRoles, setPendingStaffRoles] = useState<
    Record<string, StaffRole | "">
  >({});
  const [blockDaysByUser, setBlockDaysByUser] = useState<Record<string, number>>(
    {}
  );

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
      setPendingStaffRoles((current) => {
        const next = { ...current };
        for (const entry of data.users) {
          next[entry.id] = staffRoleForUser(entry);
        }
        return next;
      });
      setBlockDaysByUser((current) => {
        const next = { ...current };
        for (const entry of data.users) {
          if (!(entry.id in next)) next[entry.id] = 7;
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
    void loadUsers();
  }, [loadUsers]);

  async function patchUser(
    userId: string,
    payload: Record<string, unknown>
  ): Promise<User | null> {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error ?? "Failed");
    }

    const data = (await response.json()) as { user: User };
    return data.user;
  }

  async function saveStaffRole(userId: string) {
    const staffRole = pendingStaffRoles[userId] ?? "";
    setSavingId(userId);
    setError(null);

    try {
      const updated = await patchUser(userId, {
        staffRole: staffRole || null,
      });
      if (updated) {
        setUsers((current) =>
          current.map((entry) => (entry.id === userId ? updated : entry))
        );
      }
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : t("admin.saveFailed");
      setError(message);
    } finally {
      setSavingId(null);
    }
  }

  async function blockUser(userId: string) {
    setSavingId(userId);
    setError(null);

    try {
      const updated = await patchUser(userId, {
        action: "block",
        blockDays: blockDaysByUser[userId] ?? 7,
      });
      if (updated) {
        setUsers((current) =>
          current.map((entry) => (entry.id === userId ? updated : entry))
        );
      }
    } catch (blockError) {
      setError(
        blockError instanceof Error ? blockError.message : t("admin.blockFailed")
      );
    } finally {
      setSavingId(null);
    }
  }

  async function unblockUser(userId: string) {
    setSavingId(userId);
    setError(null);

    try {
      const updated = await patchUser(userId, { action: "unblock" });
      if (updated) {
        setUsers((current) =>
          current.map((entry) => (entry.id === userId ? updated : entry))
        );
      }
    } catch (unblockError) {
      setError(
        unblockError instanceof Error
          ? unblockError.message
          : t("admin.unblockFailed")
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteUser(userId: string) {
    if (!window.confirm(t("admin.deleteConfirm"))) return;

    setSavingId(userId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed");
      }

      setUsers((current) => current.filter((entry) => entry.id !== userId));
      setTotal((current) => Math.max(0, current - 1));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t("admin.deleteFailed")
      );
    } finally {
      setSavingId(null);
    }
  }

  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, total);
  const hasActiveFilters = debouncedSearch.length > 0 || roleFilter !== "all";

  return (
    <AdminShell
      title={t("admin.title")}
      subtitle={t("admin.subtitle")}
      adminOnly
      actions={
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => void loadUsers()}
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
          <option value="customer">{t("roles.customer")}</option>
          <option value="maker">{t("roles.maker")}</option>
          <option value="moderator">{t("roles.moderator")}</option>
          <option value="admin">{t("roles.admin")}</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  {t("admin.columnUser")}
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
                  {t("admin.columnActions")}
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
                  const isSelf = entry.id === user?.id;
                  const pendingStaffRole =
                    pendingStaffRoles[entry.id] ?? staffRoleForUser(entry);
                  const hasChanges =
                    pendingStaffRole !== staffRoleForUser(entry);
                  const isBusy = savingId === entry.id;

                  return (
                    <tr
                      key={entry.id}
                      className={cn(
                        "border-b border-border last:border-0",
                        entry.isBlocked && "bg-red-50/40"
                      )}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/users/${entry.id}`}
                          className="flex min-w-0 items-center gap-3 hover:opacity-90"
                        >
                          <UserAvatar
                            name={entry.name}
                            avatarUrl={entry.avatarUrl}
                            className="h-10 w-10 shrink-0"
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-brand hover:underline">
                              {entry.name}
                            </span>
                            {entry.isBlocked && entry.blockedUntil && (
                              <span className="mt-0.5 block text-xs font-medium text-red-600">
                                {t("admin.blockedBadge")}
                              </span>
                            )}
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {getUserCapabilityLabels(entry)
                                .map((label) => t(`roles.${label}`))
                                .join(" · ")}
                            </span>
                            {isSelf && (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {t("admin.selfRoleHint")}
                              </span>
                            )}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {entry.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatRegisteredAt(entry.createdAt, intlLocale)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={pendingStaffRole}
                          disabled={isSelf || isBusy}
                          onChange={(event) =>
                            setPendingStaffRoles((current) => ({
                              ...current,
                              [entry.id]: event.target.value as StaffRole | "",
                            }))
                          }
                          className="flex h-9 min-w-[130px] rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                          aria-label={t("admin.staffRoleLabel")}
                        >
                          <option value="">{t("admin.staffRoleNone")}</option>
                          {STAFF_OPTIONS.filter(Boolean).map((role) => (
                            <option key={role} value={role}>
                              {t(`roles.${role}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="brand"
                            disabled={isSelf || !hasChanges || isBusy}
                            onClick={() => void saveStaffRole(entry.id)}
                          >
                            {isBusy ? t("common.loading") : t("admin.saveRole")}
                          </Button>

                          {!isSelf && (
                            <>
                              <select
                                value={blockDaysByUser[entry.id] ?? 7}
                                onChange={(event) =>
                                  setBlockDaysByUser((current) => ({
                                    ...current,
                                    [entry.id]: Number(event.target.value),
                                  }))
                                }
                                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                aria-label={t("admin.blockDuration")}
                              >
                                {ADMIN_BLOCK_DAY_OPTIONS.map((days) => (
                                  <option key={days} value={days}>
                                    {t("admin.blockDaysShort", { days })}
                                  </option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isBusy}
                                onClick={() => void blockUser(entry.id)}
                              >
                                {t("admin.blockUser")}
                              </Button>
                              {entry.isBlocked && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isBusy}
                                  onClick={() => void unblockUser(entry.id)}
                                >
                                  {t("admin.unblockUser")}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                disabled={isBusy}
                                onClick={() => void deleteUser(entry.id)}
                              >
                                {t("admin.deleteUser")}
                              </Button>
                            </>
                          )}
                        </div>
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
    </AdminShell>
  );
}
