"use client";

import Link from "next/link";

import { useLocale, useTranslations } from "@/i18n/locale-provider";
import {
  getLegalDocument,
  type LegalDocId,
} from "@/lib/legal/documents";

export function LegalDocumentView({ docId }: { docId: LegalDocId }) {
  const { t } = useTranslations();
  const { locale } = useLocale();
  const doc = getLegalDocument(docId, locale === "en" ? "en" : "cs");

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        {doc.title}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {t("legal.effectiveFrom")}: {doc.effectiveFrom}
      </p>

      <div className="mt-8 space-y-8">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-base font-semibold text-zinc-900">
              {section.heading}
            </h2>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-zinc-700">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm">
        <Link href="/" className="font-medium text-brand underline-offset-2 hover:underline">
          {t("common.backToMap")}
        </Link>
      </p>
    </article>
  );
}
