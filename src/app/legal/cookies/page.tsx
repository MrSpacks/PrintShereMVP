import type { Metadata } from "next";

import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicPageMetadata(
  "Cookies",
  "Zásady používání cookies na PrintShare.",
  "/legal/cookies"
);

export default function CookiesPage() {
  return <LegalDocumentView docId="cookies" />;
}
