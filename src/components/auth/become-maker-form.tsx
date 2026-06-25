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
import type { MakerSignupPayload } from "@/types/auth";

export function BecomeMakerForm() {
  const router = useRouter();
  const { signupMaker } = useAuth();
  const { t } = useTranslations();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workshopName, setWorkshopName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload: MakerSignupPayload = {
      name,
      email,
      password,
      workshopName,
      address,
    };

    try {
      await signupMaker(payload);
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : t("becomeMaker.registrationFailed");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={t("becomeMaker.title")}
      subtitle={t("becomeMaker.subtitle")}
      size="lg"
      footer={
        <>
          {t("becomeMaker.footer")}{" "}
          <AuthLink href="/signup">{t("becomeMaker.signUpCustomer")}</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthError message={error} />

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t("becomeMaker.yourAccount")}
          </legend>
          <AuthField
            id="name"
            label={t("common.fullName")}
            value={name}
            onChange={setName}
          />
          <AuthField
            id="email"
            label={t("common.email")}
            type="email"
            value={email}
            onChange={setEmail}
          />
          <AuthField
            id="password"
            label={t("common.password")}
            type="password"
            value={password}
            onChange={setPassword}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t("becomeMaker.workshop")}
          </legend>

          <AuthField
            id="workshopName"
            label={t("becomeMaker.workshopName")}
            value={workshopName}
            onChange={setWorkshopName}
          />

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              {t("becomeMaker.fullAddress")}
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
              rows={3}
              placeholder={t("becomeMaker.addressPlaceholder")}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              {t("becomeMaker.addressHint")}
            </p>
          </div>
        </fieldset>

        <AuthSubmitButton
          isSubmitting={isSubmitting}
          label={t("becomeMaker.registerWorkshop")}
        />
      </form>
    </AuthCard>
  );
}
