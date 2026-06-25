"use client";

import Link from "next/link";

import { InfoFaq, InfoPage, InfoSection } from "@/components/info/info-page";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";

const FAQ_KEYS = ["1", "2", "3", "4", "5"] as const;

export function SupportView() {
  const { t } = useTranslations();

  const faqItems = FAQ_KEYS.map((key) => ({
    question: t(`support.faq${key}Question`),
    answer: t(`support.faq${key}Answer`),
  }));

  return (
    <InfoPage
      title={t("support.title")}
      subtitle={t("support.subtitle")}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("support.footer")}</p>
          <Button variant="brand" size="sm" asChild>
            <Link href="/">{t("common.backToMap")}</Link>
          </Button>
        </div>
      }
    >
      <InfoSection title={t("support.contactTitle")}>
        <div className="rounded-xl border border-border bg-card px-4 py-4 md:px-5">
          <p className="text-sm text-muted-foreground">{t("support.contactText")}</p>
          <a
            href={`mailto:${t("support.contactEmail")}`}
            className="mt-2 inline-block text-sm font-semibold text-brand hover:underline"
          >
            {t("support.contactEmail")}
          </a>
        </div>
      </InfoSection>

      <InfoSection title={t("support.faqTitle")}>
        <InfoFaq items={faqItems} />
      </InfoSection>

      <InfoSection title={t("support.linksTitle")}>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/orders" className="font-medium text-brand hover:underline">
              {t("auth.orders")}
            </Link>
            <span className="text-muted-foreground"> — {t("support.linksOrders")}</span>
          </li>
          <li>
            <Link href="/login" className="font-medium text-brand hover:underline">
              {t("auth.logIn")}
            </Link>
            <span className="text-muted-foreground"> — {t("support.linksLogin")}</span>
          </li>
          <li>
            <Link
              href="/become-maker"
              className="font-medium text-brand hover:underline"
            >
              {t("header.becomeMaker")}
            </Link>
            <span className="text-muted-foreground"> — {t("support.linksMaker")}</span>
          </li>
        </ul>
      </InfoSection>
    </InfoPage>
  );
}
