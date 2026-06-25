"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AuthCard,
  AuthError,
  AuthField,
  AuthLink,
  AuthSubmitButton,
} from "@/components/auth/auth-form";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { t } = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signup(name, email, password);
      router.push("/");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : t("auth.signupFailed");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={t("auth.signupTitle")}
      subtitle={t("auth.signupSubtitle")}
      footer={
        <>
          {t("auth.signupFooter")}{" "}
          <AuthLink href="/login">{t("auth.loginLink")}</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />

        <AuthField
          id="name"
          label={t("common.fullName")}
          value={name}
          onChange={setName}
          autoComplete="name"
        />

        <AuthField
          id="email"
          label={t("common.email")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />

        <AuthField
          id="password"
          label={t("common.password")}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />

        <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>

        <AuthSubmitButton
          isSubmitting={isSubmitting}
          label={t("auth.createAccount")}
        />
      </form>
    </AuthCard>
  );
}
