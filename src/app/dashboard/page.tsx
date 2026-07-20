"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { MakerDashboard } from "@/components/maker/maker-dashboard";
import { AppPage } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { hasMakerAccess } from "@/types/user";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslations();

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
        <h1 className="text-2xl font-semibold">{t("dashboard.loginTitle")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("dashboard.loginText")}
        </p>
        <Button variant="brand" asChild>
          <Link href="/login">{t("auth.logIn")}</Link>
        </Button>
      </div>
    );
  }

  if (!hasMakerAccess(user)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">{t("dashboard.accessTitle")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("dashboard.accessText")}{" "}
          <Link href="/become-maker" className="font-medium text-brand hover:underline">
            {t("dashboard.becomeMakerLink")}
          </Link>
        </p>
        <Button variant="outline" asChild>
          <Link href="/">{t("common.backToMap")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <AppPage
      title={t("dashboard.title")}
      subtitle={t("dashboard.subtitle")}
      width="xl"
    >
      <MakerDashboard />
    </AppPage>
  );
}
