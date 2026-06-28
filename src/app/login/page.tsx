"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import {
  AuthCard,
  AuthError,
  AuthField,
  AuthLink,
  AuthSubmitButton,
  AuthTestHint,
} from "@/components/auth/auth-form";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";
import { buildAuthPath, getSafeRedirectPath } from "@/lib/auth/safe-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { t } = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = getSafeRedirectPath(searchParams.get("next"));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push(redirectTo);
      router.refresh();
    } catch (submitError) {
      const rawMessage =
        submitError instanceof Error
          ? submitError.message
          : t("auth.loginFailed");
      const message =
        rawMessage === "ACCOUNT_BLOCKED"
          ? t("auth.accountBlocked")
          : rawMessage;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <>
          {t("auth.loginFooter")}{" "}
          <AuthLink href={buildAuthPath("/signup", redirectTo)}>
            {t("auth.signUpLink")}
          </AuthLink>
        </>
      }
    >
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

        <AuthField
          id="password"
          label={t("common.password")}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <AuthSubmitButton isSubmitting={isSubmitting} label={t("auth.logIn")} />
        <AuthTestHint />
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  const { t } = useTranslations();

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
