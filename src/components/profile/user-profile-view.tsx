"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, User as UserIcon } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { getIntlLocale } from "@/i18n/translate";
import { ADMIN_BLOCK_DAY_OPTIONS } from "@/lib/users/user-block";
import type { PublicUserProfile } from "@/types/profile";
import { cn } from "@/lib/utils";

interface UserProfileViewProps {
  userId: string;
}

export function UserProfileView({ userId }: UserProfileViewProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { t, locale } = useTranslations();
  const intlLocale = getIntlLocale(locale);

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [blockDays, setBlockDays] = useState<number>(7);

  const isSelf = currentUser?.id === userId;
  const useAdminShell = currentUser?.role === "admin" && !isSelf;

  const loadProfile = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error("Failed");
      const data = (await response.json()) as { profile: PublicUserProfile };
      setProfile(data.profile);
    } catch {
      setError(t("userProfile.loadFailed"));
    } finally {
      setIsFetching(false);
    }
  }, [userId, t]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function runAdminAction(
    payload: Record<string, unknown>,
    onSuccess?: () => void
  ) {
    setIsActing(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed");
      }

      await loadProfile();
      onSuccess?.();
    } catch (actionErr) {
      setActionError(
        actionErr instanceof Error ? actionErr.message : t("admin.actionFailed")
      );
    } finally {
      setIsActing(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t("admin.deleteConfirm"))) return;

    setIsActing(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : t("admin.deleteFailed")
      );
      setIsActing(false);
    }
  }

  const content = (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <Link
        href={useAdminShell ? "/admin/users" : "/profile"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {useAdminShell ? t("admin.backToUsers") : t("userProfile.backToProfile")}
      </Link>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {isFetching ? (
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      ) : profile ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserIcon className="h-7 w-7" aria-hidden />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                {profile.name}
              </h1>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <p className="mt-1 text-sm capitalize text-muted-foreground">
                {t(`roles.${profile.role}`)}
              </p>
              {profile.isBlocked && profile.blockedUntil && (
                <p className="mt-2 text-sm font-medium text-red-600">
                  {t("admin.blockedUntil", {
                    date: new Intl.DateTimeFormat(intlLocale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(profile.blockedUntil)),
                  })}
                </p>
              )}
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("userProfile.memberSince")}</dt>
              <dd>
                {new Intl.DateTimeFormat(intlLocale, {
                  dateStyle: "medium",
                }).format(new Date(profile.createdAt))}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("userProfile.orderCount")}</dt>
              <dd>{profile.orderCount}</dd>
            </div>
            {profile.address ? (
              <div>
                <dt className="text-muted-foreground">{t("userProfile.address")}</dt>
                <dd className="mt-1 text-foreground">{profile.address}</dd>
              </div>
            ) : null}
          </dl>

          {isSelf && (
            <Button variant="outline" className="mt-6 w-full" asChild>
              <Link href="/profile">{t("userProfile.editProfile")}</Link>
            </Button>
          )}

          {profile.canManage && currentUser?.role === "admin" && (
            <div className="mt-6 space-y-3 border-t border-border pt-4">
              <h2 className="text-sm font-semibold">{t("admin.manageUser")}</h2>

              {actionError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {actionError}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={blockDays}
                  onChange={(event) => setBlockDays(Number(event.target.value))}
                  className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
                  aria-label={t("admin.blockDuration")}
                >
                  {ADMIN_BLOCK_DAY_OPTIONS.map((days) => (
                    <option key={days} value={days}>
                      {t("admin.blockDaysOption", { days })}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isActing}
                  onClick={() =>
                    void runAdminAction({ action: "block", blockDays })
                  }
                >
                  {t("admin.blockUser")}
                </Button>
                {profile.isBlocked && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isActing}
                    onClick={() => void runAdminAction({ action: "unblock" })}
                  >
                    {t("admin.unblockUser")}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  disabled={isActing}
                  onClick={() => void handleDelete()}
                >
                  {t("admin.deleteUser")}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  if (useAdminShell) {
    return (
      <AdminShell
        title={t("userProfile.title")}
        subtitle={t("userProfile.adminSubtitle")}
        adminOnly
      >
        {content}
      </AdminShell>
    );
  }

  return <div className="flex flex-1 px-4 py-10">{content}</div>;
}

function UserAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl: string | null;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground",
        className
      )}
      aria-hidden
    >
      {name.trim().charAt(0) || "?"}
    </span>
  );
}

export { UserAvatar };
