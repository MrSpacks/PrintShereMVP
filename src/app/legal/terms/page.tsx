import type { Metadata } from "next";

import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicPageMetadata(
  "Obchodní podmínky",
  "Obchodní podmínky platformy PrintShare.",
  "/legal/terms"
);

export default function TermsPage() {
  return <LegalDocumentView docId="terms" />;
}
