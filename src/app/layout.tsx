import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import { AuthProvider } from "@/components/auth/auth-provider";
import { AppNotificationWatcher } from "@/components/layout/app-notification-watcher";
import { AppUpdateNotifier } from "@/components/layout/app-update-notifier";
import { PreventPinchZoom } from "@/components/layout/prevent-pinch-zoom";
import { PwaInstallPrompt } from "@/components/layout/pwa-install-prompt";
import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { buildRootMetadata } from "@/lib/seo/metadata";
import { getAppVersion } from "@/lib/version/app-version";
import { LocaleProvider } from "@/i18n/locale-provider";
import "./globals.css";

export const metadata: Metadata = {
  ...buildRootMetadata(),
  manifest: "/manifest.json",
  other: {
    "app-version": getAppVersion(),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex h-dvh flex-col overflow-hidden font-sans">
        <LocaleProvider>
          <AuthProvider>
            <Header />
            <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {children}
            </main>
            <SiteFooter />
            <CookieBanner />
            <PwaInstallPrompt />
            <AppUpdateNotifier />
            <AppNotificationWatcher />
            <PreventPinchZoom />
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
