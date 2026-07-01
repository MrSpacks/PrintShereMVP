import type { Metadata } from "next";

import { buildPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicPageMetadata(
  "Stát se výrobcem",
  "Zaregistrujte 3D dílnu na PrintShare, nastavte materiály a ceny a přijímejte zakázky od zákazníků v okolí.",
  "/become-maker"
);

export default function BecomeMakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
