import type { Metadata } from "next";

import { HowItWorksView } from "@/components/info/how-it-works-view";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicPageMetadata(
  "Jak to funguje",
  "Jak objednat 3D tisk u místních výrobců v Česku nebo jak se stát výrobcem na mapě PrintShare.",
  "/how-it-works"
);

export default function HowItWorksPage() {
  return <HowItWorksView />;
}
