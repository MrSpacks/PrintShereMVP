"use client";

import Link from "next/link";

import { BecomeMakerForm } from "@/components/auth/become-maker-form";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { hasMakerAccess } from "@/types/user";

export default function BecomeMakerPage() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslations();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (user && hasMakerAccess(user)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">{t("becomeMaker.alreadyMakerTitle")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("becomeMaker.alreadyMakerText")}
        </p>
        <Button variant="brand" asChild>
          <Link href="/dashboard">{t("becomeMaker.openDashboard")}</Link>
        </Button>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">
          {t("becomeMaker.logoutToRegisterTitle")}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("becomeMaker.logoutToRegisterText")}
        </p>
        <Button variant="outline" asChild>
          <Link href="/">{t("common.backToMap")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1">
      <BecomeMakerForm />
    </div>
  );
}
