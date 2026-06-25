"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useMessageInbox } from "@/hooks/use-message-inbox";
import { useTranslations } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { getIntlLocale } from "@/i18n/translate";
import { cn } from "@/lib/utils";

function formatRelativeTime(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return locale === "cs" ? "právě teď" : "just now";
  if (diffMin < 60) {
    return locale === "cs" ? `před ${diffMin} min` : `${diffMin}m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return locale === "cs" ? `před ${diffHours} h` : `${diffHours}h ago`;
  }

  return date.toLocaleDateString(getIntlLocale(locale), {
    day: "numeric",
    month: "short",
  });
}

export function MessageInbox() {
  const { user } = useAuth();
  const { t, locale } = useTranslations();
  const pathname = usePathname();
  const { items, totalUnread, refetch } = useMessageInbox(Boolean(user));
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, pathname, refetch]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="relative gap-1.5"
        aria-label={
          totalUnread > 0
            ? `${t("inbox.messages")} (${totalUnread})`
            : t("inbox.messages")
        }
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) refetch();
        }}
      >
        <Mail className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{t("inbox.messages")}</span>
        {totalUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-brand-foreground sm:static sm:ml-0.5">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </Button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-lg border border-border bg-background shadow-lg"
          role="listbox"
          aria-label={t("inbox.messages")}
        >
          <div className="border-b border-border/60 px-3 py-2 text-sm font-medium text-foreground">
            {t("inbox.title")}
          </div>

          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("inbox.empty")}
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <li key={item.messageId}>
                  <Link
                    href={`/orders/${item.orderId}`}
                    className={cn(
                      "block border-b border-border/40 px-3 py-2.5 transition-colors last:border-b-0",
                      "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                    )}
                    role="option"
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.fileName}
                      </p>
                      <time
                        className="shrink-0 text-xs text-muted-foreground"
                        dateTime={item.createdAt}
                      >
                        {formatRelativeTime(item.createdAt, locale)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("inbox.from", { name: item.counterpartyName })}
                      {item.unreadCount > 1
                        ? ` · ${t("inbox.unreadCount", { count: item.unreadCount })}`
                        : null}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-foreground/90">
                      <span className="font-medium">{item.senderName}:</span>{" "}
                      {item.preview}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
