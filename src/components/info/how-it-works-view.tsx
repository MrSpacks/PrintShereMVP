"use client";

import Link from "next/link";

import {
  InfoPage,
  InfoSection,
  InfoSteps,
} from "@/components/info/info-page";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";

const CUSTOMER_STEP_KEYS = ["1", "2", "3", "4", "5"] as const;
const MAKER_STEP_KEYS = ["1", "2", "3", "4"] as const;

export function HowItWorksView() {
  const { t } = useTranslations();

  const customerSteps = CUSTOMER_STEP_KEYS.map((key) => ({
    title: t(`howItWorks.customer.step${key}Title`),
    text: t(`howItWorks.customer.step${key}Text`),
  }));

  const makerSteps = MAKER_STEP_KEYS.map((key) => ({
    title: t(`howItWorks.maker.step${key}Title`),
    text: t(`howItWorks.maker.step${key}Text`),
  }));

  return (
    <InfoPage
      title={t("howItWorks.title")}
      subtitle={t("howItWorks.subtitle")}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("howItWorks.footer")}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="brand" size="sm" asChild>
              <Link href="/">{t("common.goToMap")}</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/become-maker">{t("header.becomeMaker")}</Link>
            </Button>
          </div>
        </div>
      }
    >
      <InfoSection title={t("howItWorks.customerTitle")}>
        <InfoSteps steps={customerSteps} />
      </InfoSection>

      <InfoSection title={t("howItWorks.makerTitle")}>
        <InfoSteps steps={makerSteps} />
      </InfoSection>
    </InfoPage>
  );
}
