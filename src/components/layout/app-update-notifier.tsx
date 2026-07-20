"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { isNewerAppVersion } from "@/lib/version/app-version";

const CLIENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

/** Интервал фоновой проверки новой версии (5 мин) */
const POLL_MS = 5 * 60 * 1000;

/**
 * Сравнивает версию в загруженном JS с /api/version.
 * После деплоя на Vercel у старых вкладок остаётся старый бандл — баннер просит reload.
 */
export function AppUpdateNotifier() {
  const { t } = useTranslations();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (CLIENT_VERSION === "dev") return;

    try {
      const response = await fetch("/api/version", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) return;

      const data = (await response.json()) as { version?: string };
      if (isNewerAppVersion(CLIENT_VERSION, data.version ?? "")) {
        setUpdateAvailable(true);
      }
    } catch {
      // сеть временно недоступна — не показываем ложное обновление
    }
  }, []);

  useEffect(() => {
    void checkForUpdate();

    const interval = setInterval(() => void checkForUpdate(), POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkForUpdate();
      }
    };

    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkForUpdate);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [checkForUpdate]);

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-brand/30 bg-brand px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-brand-foreground shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">{t("common.updateAvailable")}</p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="bg-white text-brand hover:bg-white/90"
            onClick={() => window.location.reload()}
          >
            {t("common.reloadApp")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-brand-foreground hover:bg-white/10"
            onClick={() => setUpdateAvailable(false)}
          >
            {t("common.later")}
          </Button>
        </div>
      </div>
    </div>
  );
}
