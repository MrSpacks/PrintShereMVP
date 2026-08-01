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
import { PrinterPicker } from "@/components/maker/printer-picker";
import { useTranslations } from "@/i18n/locale-provider";
import type { MakerSignupPayload } from "@/types/auth";
import type { User } from "@/types/user";
import type { WorkshopPrinterInput } from "@/types/maker";

export function BecomeMakerForm() {
  const router = useRouter();
  const { user, signupMaker, refetch } = useAuth();
  const { t } = useTranslations();
  const isExistingAccount = Boolean(user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workshopName, setWorkshopName] = useState("");
  const [address, setAddress] = useState("");
  const [printers, setPrinters] = useState<WorkshopPrinterInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isExistingAccount) {
        const payload = { workshopName, address, printers };
        console.log("[BecomeMakerForm] Submitting workshop for existing account:", payload);
        
        const response = await fetch("/api/maker/workshops", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as { error?: string; user?: User };

        if (!response.ok) {
          console.error("[BecomeMakerForm] Workshop creation failed:", data);
          throw new Error(data.error ?? t("becomeMaker.registrationFailed"));
        }

        await refetch();
      } else {
        const payload: MakerSignupPayload = {
          name,
          email,
          password,
          workshopName,
          address,
          printers,
        };
        await signupMaker(payload);
      }

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
      subtitle={
        isExistingAccount
          ? t("becomeMaker.subtitleExisting", { name: user?.name ?? "" })
          : t("becomeMaker.subtitle")
      }
      size="xl"
      footer={
        isExistingAccount ? null : (
          <>
            {t("becomeMaker.footer")}{" "}
            <AuthLink href="/signup">{t("becomeMaker.signUpCustomer")}</AuthLink>
          </>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthError message={error} />

        {!isExistingAccount ? (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-foreground">
              {t("becomeMaker.yourAccount")}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
            <AuthField
              id="password"
              label={t("common.password")}
              type="password"
              value={password}
              onChange={setPassword}
            />
          </fieldset>
        ) : (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {t("becomeMaker.existingAccountHint", {
              email: user?.email ?? "",
            })}
          </p>
        )}

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t("becomeMaker.workshop")}
          </legend>

          <div className="grid gap-4 lg:grid-cols-2">
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
                rows={2}
                placeholder={t("becomeMaker.addressPlaceholder")}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {t("becomeMaker.addressHint")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("workshop.printersTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {t("workshop.printersHint")}
            </p>
            <PrinterPicker printers={printers} onChange={setPrinters} />
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
