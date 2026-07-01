"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import {
  AuthCard,
  AuthError,
  AuthField,
  AuthLink,
  AuthSubmitButton,
} from "@/components/auth/auth-form";
import {
  GoogleOAuthButton,
  OAuthDivider,
} from "@/components/auth/oauth-buttons";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";
import { buildAuthPath, getSafeRedirectPath } from "@/lib/auth/safe-redirect";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();
  const { t } = useTranslations();
  const [name, setName] = useState("");
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
      await signup(name, email, password);
      router.push(redirectTo);
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
          <AuthLink href={buildAuthPath("/login", redirectTo)}>
            {t("auth.loginLink")}
          </AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />

        <GoogleOAuthButton next={redirectTo} />
        <OAuthDivider />

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

export default function SignupPage() {
  const { t } = useTranslations();

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
