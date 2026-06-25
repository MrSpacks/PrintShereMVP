"use client";

import { Button } from "@/components/ui/button";
import { LOCALES, type Locale } from "@/i18n/config";
import { useTranslations } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslations();

  return (
    <div
      className="flex items-center rounded-md border border-border/60 p-0.5"
      role="group"
      aria-label={t("language.switch")}
    >
      {LOCALES.map((code) => (
        <Button
          key={code}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setLocale(code as Locale)}
          className={cn(
            "h-7 min-w-[2.25rem] px-2 text-xs font-semibold",
            locale === code
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={locale === code}
        >
          {t(`language.${code}`)}
        </Button>
      ))}
    </div>
  );
}
