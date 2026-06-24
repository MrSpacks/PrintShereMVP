import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import { AuthProvider } from "@/components/auth/auth-provider";
import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Print Local P2P — 3D Printing Marketplace in Prague",
  description:
    "Find local 3D printing makers in Prague. Upload your model, compare prices on the map, and order nearby.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <AuthProvider>
          <Header />
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
