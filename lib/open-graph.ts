import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

/** A page-level openGraph replaces the root one, so repeat its shared fields. */
export function pageOpenGraph(page: {
  title: string;
  description: string;
  url: string;
}): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    ...page,
    images: ["/opengraph-image"],
  };
}
