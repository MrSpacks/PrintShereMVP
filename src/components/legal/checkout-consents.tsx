"use client";

import Link from "next/link";

import { useTranslations } from "@/i18n/locale-provider";
import { LEGAL_PATHS } from "@/lib/legal/constants";
import { cn } from "@/lib/utils";

export interface CheckoutConsentsValue {
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedCustomManufacture: boolean;
}

interface CheckoutConsentsProps {
  value: CheckoutConsentsValue;
  onChange: (next: CheckoutConsentsValue) => void;
  className?: string;
}

function ConsentRow({
  id,
  checked,
  onCheckedChange,
  children,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-2.5 text-left text-xs leading-snug text-zinc-700"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-400"
      />
      <span>{children}</span>
    </label>
  );
}

export function CheckoutConsents({
  value,
  onChange,
  className,
}: CheckoutConsentsProps) {
  const { t } = useTranslations();

  const allAccepted =
    value.acceptedTerms &&
    value.acceptedPrivacy &&
    value.acceptedCustomManufacture;

  return (
    <div className={cn("space-y-2.5 rounded-lg border border-border bg-muted/20 p-3", className)}>
      <ConsentRow
        id="consent-terms"
        checked={value.acceptedTerms}
        onCheckedChange={(acceptedTerms) =>
          onChange({ ...value, acceptedTerms })
        }
      >
        {t("checkout.consentTermsPrefix")}{" "}
        <Link
          href={LEGAL_PATHS.terms}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-2"
          onClick={(event) => event.stopPropagation()}
        >
          {t("legal.terms")}
        </Link>
        .
      </ConsentRow>

      <ConsentRow
        id="consent-privacy"
        checked={value.acceptedPrivacy}
        onCheckedChange={(acceptedPrivacy) =>
          onChange({ ...value, acceptedPrivacy })
        }
      >
        {t("checkout.consentPrivacyPrefix")}{" "}
        <Link
          href={LEGAL_PATHS.privacy}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-2"
          onClick={(event) => event.stopPropagation()}
        >
          {t("legal.privacy")}
        </Link>
        .
      </ConsentRow>

      <ConsentRow
        id="consent-custom"
        checked={value.acceptedCustomManufacture}
        onCheckedChange={(acceptedCustomManufacture) =>
          onChange({ ...value, acceptedCustomManufacture })
        }
      >
        {t("checkout.consentCustomManufacture")}
      </ConsentRow>

      {!allAccepted && (
        <p className="text-[11px] text-zinc-500">{t("checkout.consentsRequired")}</p>
      )}
    </div>
  );
}

export function areCheckoutConsentsComplete(
  value: CheckoutConsentsValue
): boolean {
  return (
    value.acceptedTerms &&
    value.acceptedPrivacy &&
    value.acceptedCustomManufacture
  );
}
