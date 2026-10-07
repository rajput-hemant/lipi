import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/"],
      },
    ],
    sitemap: `${env.NEXT_PUBLIC_APP_URL ?? siteConfig.url}/sitemap.xml`,
  };
}
