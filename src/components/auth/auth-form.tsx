"use client";

"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface AuthFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required = true,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  size?: "md" | "lg";
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: AuthCardProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div
        className={cn(
          "w-full rounded-xl border border-border bg-card p-6 shadow-sm",
          size === "lg" ? "max-w-lg" : "max-w-md"
        )}
      >
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {children}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      </div>
    </div>
  );
}

interface AuthErrorProps {
  message: string | null;
}

export function AuthError({ message }: AuthErrorProps) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className={cn(
        "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      )}
    >
      {message}
    </p>
  );
}

export function AuthTestHint() {
  const { t } = useTranslations();

  return (
    <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
      {t("common.testAccount")} <strong>anna@example.com</strong> /{" "}
      <strong>test123456</strong>
    </p>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="font-medium text-brand hover:underline">
      {children}
    </Link>
  );
}

export function AuthSubmitButton({
  isSubmitting,
  label,
}: {
  isSubmitting: boolean;
  label: string;
}) {
  const { t } = useTranslations();

  return (
    <Button type="submit" variant="brand" className="w-full" disabled={isSubmitting}>
      {isSubmitting ? t("common.pleaseWait") : label}
    </Button>
  );
}
