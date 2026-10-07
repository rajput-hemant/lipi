import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";

type Entry = [
  path: string,
  changeFrequency: "weekly" | "monthly",
  priority: number,
];

const entries: Entry[] = [
  ["", "weekly", 1.0],
  ["/pricing", "monthly", 0.8],
  ["/privacy", "monthly", 0.3],
  ["/terms", "monthly", 0.3],
  ["/login", "monthly", 0.5],
  ["/signup", "monthly", 0.5],
];

export default function sitemap(): MetadataRoute.Sitemap {
  return entries.map(([path, changeFrequency, priority]) => ({
    url: `${env.NEXT_PUBLIC_APP_URL ?? siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
