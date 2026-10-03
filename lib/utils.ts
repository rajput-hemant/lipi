import { siteConfig } from "@/config/site";
import { logger } from "@/lib/logger";
import { env } from "./env";

export { cn } from "cn";

export function absoluteUrl(path: string) {
  if (env.VERCEL) {
    switch (env.NEXT_PUBLIC_VERCEL_ENV) {
      case "production":
        return `${siteConfig.url}${path}`;

      case "preview":
        return `https://${env.NEXT_PUBLIC_VERCEL_BRANCH_URL}${path}`;

      default:
        // development
        return `http://localhost:${env.PORT ?? 3000}${path}`;
    }
  } else {
    return `${siteConfig.url}${path}`;
  }
}

export async function getGitHubStars(): Promise<string | null> {
  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
    };
    if (env.GITHUB_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${env.GITHUB_ACCESS_TOKEN}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${siteConfig.links.github
        .split("/")
        .slice(-2)
        .join("/")}`,
      {
        headers,
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { stargazers_count: number };

    return json.stargazers_count.toLocaleString();
  } catch (error) {
    logger.error("Failed to fetch GitHub stars", error);
    return null;
  }
}

export const formatCurrency = (amount: number, currency: string | null) => {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
