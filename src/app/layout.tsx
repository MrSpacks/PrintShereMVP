import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import { AuthProvider } from "@/components/auth/auth-provider";
import { Header } from "@/components/layout/header";
import { LocaleProvider } from "@/i18n/locale-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Print Local P2P — 3D tisk v Praze",
  description:
    "Najděte místní 3D tiskaře v Praze. Nahrajte model, porovnejte ceny na mapě a objednejte tisk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <LocaleProvider>
          <AuthProvider>
            <Header />
            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
