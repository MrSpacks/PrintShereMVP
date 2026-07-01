import type { Metadata } from "next";

/** Auth, dashboard, orders — not for search indexing */
export const privatePageMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
