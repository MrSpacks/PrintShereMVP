import type { Metadata } from "next";

import { SupportView } from "@/components/info/support-view";

export const metadata: Metadata = {
  title: "Podpora — Print Local P2P",
  description:
    "Kontakt, časté dotazy a odkazy k objednávkám a registraci výrobce.",
};

export default function SupportPage() {
  return <SupportView />;
}
