"use client";

import Link from "next/link";

import { useTranslations } from "@/i18n/locale-provider";

const STEP_KEYS = ["1", "2", "3", "4"] as const;

export function ModelHomeSteps() {
  const { t } = useTranslations();

  return (
    <div className="w-full max-w-xs">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
        {t("model.homeStepsTitle")}
      </p>
      <ol className="space-y-2.5">
        {STEP_KEYS.map((key, index) => (
          <li key={key} className="flex gap-3 text-left">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand"
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-zinc-200">
                {t(`model.homeSteps.step${key}Title`)}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                {t(`model.homeSteps.step${key}Text`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <Link
        href="/how-it-works"
        className="mt-4 block text-center text-xs text-zinc-500 transition-colors hover:text-brand"
      >
        {t("model.homeStepsMore")}
      </Link>
    </div>
  );
}
