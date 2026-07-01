import type { Metadata } from "next";

import { SupportView } from "@/components/info/support-view";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicPageMetadata(
  "Podpora",
  "Kontakt, časté dotazy a odkazy k objednávkám a registraci výrobce na PrintShare.",
  "/support"
);

export default function SupportPage() {
  return <SupportView />;
}
