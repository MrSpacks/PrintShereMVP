import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/dashboard/",
        "/orders/",
        "/profile/",
        "/login",
        "/signup",
        "/moderation/",
        "/users/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
