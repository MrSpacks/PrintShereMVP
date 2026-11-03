"use client";

import { useState } from "react";

import {
  AuthCard,
  AuthError,
  AuthField,
  AuthLink,
  AuthSubmitButton,
} from "@/components/auth/auth-form";
import { useTranslations } from "@/i18n/locale-provider";

export default function ForgotPasswordPage() {
  const { t } = useTranslations();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error();
      setSent(true);
    } catch {
      setError(t("auth.forgotFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotSubtitle")}
      footer={<AuthLink href="/login">{t("auth.backToLogin")}</AuthLink>}
    >
      {sent ? (
        <p
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
        >
          {t("auth.forgotSent")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthError message={error} />

          <AuthField
            id="email"
            label={t("common.email")}
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />

          <AuthSubmitButton
            isSubmitting={isSubmitting}
            label={t("auth.forgotSubmit")}
          />
        </form>
      )}
    </AuthCard>
  );
}
