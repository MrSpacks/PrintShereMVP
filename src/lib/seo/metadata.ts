import type { Metadata } from "next";

import { getSiteUrl } from "@/lib/site";

const siteName = "PrintShare";
const defaultTitle = "PrintShare | 3D tisk v Česku bez starostí";
const defaultDescription =
  "První 3D tiskový marketplace v České republice. Najděte nejbližšího tiskaře, nahrajte STL model, spočítejte cenu a tiskněte bezpečně s Escrow platbou a doručením přes Zásilkovnu.";

const ogDescription =
  "Spojujeme zákazníky s lokálními majiteli 3D tiskáren. Rychlý výpočet ceny, bezpečné escrow platby a doručení po celé ČR.";

const keywords = [
  "3D tisk",
  "3D tiskárna",
  "zakázkový 3D tisk",
  "Prusa",
  "3D marketplace",
  "Zásilkovna 3D tisk",
  "Stripe platby Česko",
  "PrintShare",
  "3D tisk Praha",
];

export function buildRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${siteName}`,
    },
    description: defaultDescription,
    keywords,
    authors: [{ name: "PrintShare Team" }],
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: siteUrl,
    },
    icons: {
      icon: "/logo.png",
      apple: "/logo.png",
    },
    openGraph: {
      title: defaultTitle,
      description: ogDescription,
      url: siteUrl,
      siteName,
      locale: "cs_CZ",
      type: "website",
      // Square brand logo until a dedicated 1200×630 OG asset exists
      images: [
        {
          url: "/logo.png",
          width: 651,
          height: 712,
          alt: "PrintShare — 3D tiskový marketplace v Česku",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: ogDescription,
      images: ["/logo.png"],
    },
  };
}

export function buildPublicPageMetadata(
  title: string,
  description: string,
  path: string
): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | PrintShare`,
      description,
      url,
      siteName: "PrintShare",
      locale: "cs_CZ",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | PrintShare`,
      description,
    },
  };
}
