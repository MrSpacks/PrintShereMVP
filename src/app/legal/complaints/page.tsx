import type { Metadata } from "next";

import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicPageMetadata(
  "Reklamační řád",
  "Reklamační řád platformy PrintShare.",
  "/legal/complaints"
);

export default function ComplaintsPage() {
  return <LegalDocumentView docId="complaints" />;
}
