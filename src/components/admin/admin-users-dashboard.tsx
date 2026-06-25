"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";
import type { User, UserRole } from "@/types/user";

const ROLE_OPTIONS: UserRole[] = ["customer", "maker", "moderator", "admin"];

function roleOptionsForUser(user: User): UserRole[] {
  if (user.makerId) return ROLE_OPTIONS;
  return ROLE_OPTIONS.filter((role) => role !== "maker");
}

export function AdminUsersDashboard() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslations();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, UserRole>>({});

  const loadUsers = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed");
      const data = (await response.json()) as { users: User[] };
      setUsers(data.users);
      setPendingRoles(
        Object.fromEntries(data.users.map((entry) => [entry.id, entry.role]))
      );
    } catch {
      setError(t("admin.loadFailed"));
    } finally {
      setIsFetching(false);
    }
  }, [t]);

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
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("admin.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.subtitle")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadUsers()}>
          {t("common.refresh")}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isFetching ? (
        <div className="space-y-3">
          {[1, 2, 3].map((key) => (
            <div
              key={key}
              className="h-16 animate-pulse rounded-xl bg-muted"
              aria-hidden
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {users.map((entry) => {
            const isSelf = entry.id === user.id;
            const pendingRole = pendingRoles[entry.id] ?? entry.role;
            const hasChanges = pendingRole !== entry.role;

            return (
              <li
                key={entry.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{entry.name}</p>
                    <p className="text-sm text-muted-foreground">{entry.email}</p>
                    {isSelf && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("admin.selfRoleHint")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={pendingRole}
                      disabled={isSelf || savingId === entry.id}
                      onChange={(event) =>
                        setPendingRoles((current) => ({
                          ...current,
                          [entry.id]: event.target.value as UserRole,
                        }))
                      }
                      className="flex h-10 min-w-[140px] rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                      aria-label={t("admin.roleLabel")}
                    >
                      {roleOptionsForUser(entry).map((role) => (
                        <option key={role} value={role}>
                          {t(`roles.${role}`)}
                        </option>
                      ))}
                    </select>

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
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
