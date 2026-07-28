"use client";

import { Download, Share, Smartphone, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { readCookieConsent } from "@/lib/legal/cookie-consent";
import { requestBrowserNotificationPermission } from "@/lib/notifications/browser-notifications";
import {
  type BeforeInstallPromptEvent,
  isIosSafari,
  isStandalonePwa,
  readPwaInstallDismissed,
  writePwaInstallDismissed,
} from "@/lib/pwa/pwa-install";

/**
 * Bottom sheet: instalace PWA + volitelně notifikace.
 * Nezobrazí se ve standalone režimu ani po „Ne teď“ (14 dní).
 */
export function PwaInstallPrompt() {
  const { t } = useTranslations();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosMode, setIosMode] = useState(false);
  const [cookieResolved, setCookieResolved] = useState(false);
  const [installing, setInstalling] = useState(false);

  const evaluateVisibility = useCallback(() => {
    if (isStandalonePwa()) {
      setVisible(false);
      return;
    }
    if (readPwaInstallDismissed()) {
      setVisible(false);
      return;
    }
    if (readCookieConsent() === null) {
      setCookieResolved(false);
      setVisible(false);
      return;
    }
    setCookieResolved(true);
    setVisible(true);
  }, []);

  useEffect(() => {
    setIosMode(isIosSafari());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      evaluateVisibility();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("printshare-cookie-consent", evaluateVisibility);
    evaluateVisibility();

    const onStorage = () => evaluateVisibility();
    window.addEventListener("storage", onStorage);

    const interval = setInterval(evaluateVisibility, 2000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("printshare-cookie-consent", evaluateVisibility);
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, [evaluateVisibility]);

  const dismiss = () => {
    writePwaInstallDismissed();
    setVisible(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setVisible(false);
          writePwaInstallDismissed();
        }
      } finally {
        setInstalling(false);
        setDeferredPrompt(null);
      }
      return;
    }

    if (iosMode) {
      return;
    }

    dismiss();
  };

  const handleEnableNotifications = async () => {
    await requestBrowserNotificationPermission();
  };

  if (!visible || !cookieResolved) return null;

  const canNativeInstall = Boolean(deferredPrompt);
  const showIosHelp = iosMode && !canNativeInstall;

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-desc"
      className="fixed inset-x-0 bottom-0 z-[9998] border-t border-zinc-700 bg-zinc-950/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-sm md:p-5"
    >
      <div className="mx-auto max-w-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <Smartphone className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2
                id="pwa-install-title"
                className="text-sm font-semibold text-zinc-100"
              >
                {showIosHelp ? t("pwa.installIosTitle") : t("pwa.installTitle")}
              </h2>
              <button
                type="button"
                onClick={dismiss}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                aria-label={t("common.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p
              id="pwa-install-desc"
              className="mt-1 text-xs leading-relaxed text-zinc-400"
            >
              {t("pwa.installBody")}
            </p>

            {showIosHelp ? (
              <ol className="mt-3 space-y-1.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Share className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                  {t("pwa.installIosStep1")}
                </li>
                <li className="flex items-center gap-2">
                  <Download className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                  {t("pwa.installIosStep2")}
                </li>
              </ol>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {(canNativeInstall || showIosHelp) && (
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  className="min-h-10 flex-1 sm:flex-none"
                  disabled={installing}
                  onClick={() => void handleInstall()}
                >
                  {canNativeInstall ? t("pwa.installButton") : t("pwa.installIosTitle")}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 flex-1 border-zinc-600 bg-transparent text-zinc-100 hover:bg-zinc-800 sm:flex-none"
                onClick={() => void handleEnableNotifications()}
              >
                {t("pwa.enableNotifications")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-10 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 sm:flex-none"
                onClick={dismiss}
              >
                {t("pwa.dismiss")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
