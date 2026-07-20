import type { Metadata } from "next";

import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicPageMetadata(
  "Ochrana osobních údajů",
  "Zásady ochrany osobních údajů PrintShare.",
  "/legal/privacy"
);

export default function PrivacyPage() {
  return <LegalDocumentView docId="privacy" />;
}
