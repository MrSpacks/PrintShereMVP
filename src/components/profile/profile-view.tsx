"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AuthError,
  AuthField,
  AuthSubmitButton,
} from "@/components/auth/auth-form";
import { useAuth } from "@/components/auth/auth-provider";
import { AvatarPicker } from "@/components/profile/avatar-picker";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { hasMakerAccess, type User, type UserRole } from "@/types/user";

export function ProfileView() {
  const router = useRouter();
  const { user, isLoading, refetch } = useAuth();
  const { t } = useTranslations();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialAddress, setInitialAddress] = useState("");

  useEffect(() => {
    if (!user) return;

    const currentUser = user;
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) return;

        const data = (await response.json()) as {
          user: User;
          address: string;
        };

        if (cancelled) return;

        setName(data.user.name);
        setEmail(data.user.email);
        setAvatarUrl(data.user.avatarUrl);
        setAddress(data.address);
        setInitialAddress(data.address);
      } catch {
        if (!cancelled) {
          setName(currentUser.name);
          setEmail(currentUser.email);
          setAvatarUrl(currentUser.avatarUrl);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">{t("profile.loginTitle")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("profile.loginText")}
        </p>
        <Button variant="brand" asChild>
          <Link href="/login">{t("auth.logIn")}</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const payload: Record<string, string | null> = {
      name: name.trim(),
      email: email.trim(),
      address: address.trim(),
    };

    if (avatarUrl !== user.avatarUrl) {
      payload.avatarUrl = avatarUrl;
    }

    if (currentPassword || newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        user?: User;
        address?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? t("profile.saveFailed"));
      }

      if (data.address !== undefined) {
        setAddress(data.address);
        setInitialAddress(data.address);
      }

      await refetch();
      setCurrentPassword("");
      setNewPassword("");
      setSuccess(t("profile.saveSuccess"));
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t("profile.saveFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabel = t(`roles.${user.role as UserRole}`);
  const isMaker = hasMakerAccess(user);
  const addressChanged = address.trim() !== initialAddress.trim();

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("profile.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("profile.subtitle")}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <AuthError message={error} />

        {success && (
          <p
            role="status"
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            {success}
          </p>
        )}

        <AvatarPicker
          avatarUrl={avatarUrl}
          name={name || user.name}
          onChange={setAvatarUrl}
          onError={setError}
        />

        <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t("profile.roleLabel")}:{" "}
          <span className="font-medium capitalize text-foreground">
            {roleLabel}
          </span>
        </div>

        <AuthField
          id="profile-name"
          label={t("common.fullName")}
          value={name}
          onChange={setName}
          autoComplete="name"
        />

        <AuthField
          id="profile-email"
          label={t("common.email")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />

        <div className="space-y-2">
          <label htmlFor="profile-address" className="text-sm font-medium text-foreground">
            {isMaker ? t("profile.workshopAddress") : t("profile.address")}
          </label>
          <textarea
            id="profile-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            rows={3}
            placeholder={t("becomeMaker.addressPlaceholder")}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            {isMaker ? t("profile.workshopAddressHint") : t("profile.addressHint")}
          </p>
        </div>

        {isMaker && addressChanged && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {t("profile.workshopAddressMapNote")}
          </p>
        )}

        <div className="space-y-4 border-t border-border/60 pt-4">
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-foreground">
              {t("profile.changePassword")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("profile.passwordHint")}
            </p>
          </div>

          <AuthField
            id="profile-current-password"
            label={t("profile.currentPassword")}
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            required={false}
          />

          <AuthField
            id="profile-new-password"
            label={t("profile.newPassword")}
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            required={false}
          />
        </div>

        <AuthSubmitButton
          isSubmitting={isSubmitting}
          label={t("profile.save")}
        />
      </form>
    </div>
  );
}
