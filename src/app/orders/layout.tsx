import type { Metadata } from "next";

import { privatePageMetadata } from "@/lib/seo/private-page-metadata";

export const metadata: Metadata = privatePageMetadata;

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
