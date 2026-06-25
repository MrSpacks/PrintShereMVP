import type { Metadata } from "next";

import { HowItWorksView } from "@/components/info/how-it-works-view";

export const metadata: Metadata = {
  title: "Jak to funguje — Print Local P2P",
  description:
    "Jak objednat 3D tisk u místních výrobců v Praze nebo jak se stát výrobcem na mapě.",
};

export default function HowItWorksPage() {
  return <HowItWorksView />;
}
