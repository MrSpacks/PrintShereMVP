"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

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
  const { t } = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isPassword ? "pr-10 pl-3" : "px-3"
          )}
        />
        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={
              showPassword ? t("common.hidePassword") : t("common.showPassword")
            }
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl";
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: AuthCardProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6 md:py-8">
      <div
        className={cn(
          "w-full rounded-xl border border-border bg-card p-6 shadow-sm",
          size === "xl" ? "max-w-3xl" : size === "lg" ? "max-w-lg" : "max-w-md"
        )}
      >
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {children}

        {footer ? (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        ) : null}
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
