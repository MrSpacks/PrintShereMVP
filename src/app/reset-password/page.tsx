"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import {
  AuthCard,
  AuthError,
  AuthField,
  AuthLink,
  AuthSubmitButton,
} from "@/components/auth/auth-form";
import { useTranslations } from "@/i18n/locale-provider";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [linkInvalid, setLinkInvalid] = useState(!token);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("auth.passwordHint"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.passwordsDontMatch"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (response.ok) {
        setDone(true);
      } else if (data.error === "INVALID_TOKEN") {
        setLinkInvalid(true);
      } else if (data.error === "PASSWORD_TOO_SHORT") {
        setError(t("auth.passwordHint"));
      } else {
        setError(t("auth.resetFailed"));
      }
    } catch {
      setError(t("auth.resetFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={t("auth.resetTitle")}
      subtitle={t("auth.resetSubtitle")}
      footer={<AuthLink href="/login">{t("auth.backToLogin")}</AuthLink>}
    >
      {done ? (
        <p
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
        >
          {t("auth.resetSuccess")}{" "}
          <AuthLink href="/login">{t("auth.logIn")}</AuthLink>
        </p>
      ) : linkInvalid ? (
        <div className="space-y-4">
          <AuthError message={t("auth.resetInvalidLink")} />
          <AuthLink href="/forgot-password">{t("auth.requestNewLink")}</AuthLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthError message={error} />

          <AuthField
            id="password"
            label={t("auth.newPassword")}
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />

          <AuthField
            id="confirm-password"
            label={t("auth.confirmPassword")}
            type="password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
          />

          <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>

          <AuthSubmitButton
            isSubmitting={isSubmitting}
            label={t("auth.resetSubmit")}
          />
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslations();

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
