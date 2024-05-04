import { clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import type { ClassValue } from "clsx";

import { siteConfig } from "@/config/site";
import { env } from "./env";

/**
 * Merges the given class names with the tailwind classes
 * @param inputs The class names to merge
 * @returns The merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the absolute url for the given path based on the current environment
 * @param path The path to get the absolute url for
 * @returns The absolute url for the given path
 */
export function absoluteUrl(path: string) {
  if (process.env.VERCEL) {
    switch (process.env.NEXT_PUBLIC_VERCEL_ENV) {
      case "production":
        return `${siteConfig.url}${path}`;

      case "preview":
        return `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}${path}`;

      default:
        // development
        return `http://localhost:${process.env.PORT ?? 3000}${path}`;
    }
  } else if (process.env.NETLIFY) {
    switch (process.env.CONTEXT) {
      case "production":
        return `${siteConfig.url}${path}`;

      case "deploy-preview":
      case "branch-deploy":
        return `https://${process.env.DEPLOY_PRIME_URL}${path}`;

      default:
        // development
        return `http://localhost:${process.env.PORT ?? 3000}${path}`;
    }
  } else {
    return `${siteConfig.url}${path}`;
  }
}

/**
 * Fetches the GitHub stars for the current repository
 * @returns Repo stars count
 */
export async function getGitHubStars(): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${siteConfig.links.github
        .split("/")
        .slice(-2)
        .join("/")}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${env.GITHUB_ACCESS_TOKEN}`,
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { stargazers_count: string };

    return parseInt(json.stargazers_count).toLocaleString();
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * Formats the given amount to the given currency
 * @param amount The amount to format
 * @param currency The currency to format the amount to
 * @returns The formatted amount
 */
export const formatCurrency = (amount: number, currency: string | null) => {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/**
 * Tests the current platform against the given regular expression.
 * @param re The regular expression to test against.
 * @returns True if the platform matches the regular expression, false otherwise.
 *
 * @see https://github.com/adobe/react-spectrum/blob/5e49ce79094a90839cec20fc5ce788a34bf4b085/packages/%40react-aria/utils/src/platform.ts#L23C1-L50C1
 */
function testPlatform(re: RegExp) {
  return typeof window !== "undefined" && window.navigator != null ?
      re.test(
        // @ts-expect-error - navigator["userAgentData"]
        window.navigator["userAgentData"]?.platform || window.navigator.platform
      )
    : false;
}

/**
 * Checks if the current platform is Mac.
 * @returns True if the platform is Mac, false otherwise.
 */
export function isMac() {
  return testPlatform(/^Mac/i);
}

/**
 * Checks if the current platform is Windows.
 * @returns True if the platform is Windows, false otherwise.
 */
export function isIPhone() {
  return testPlatform(/^iPhone/i);
}

/**
 * Checks if the current platform is iPad.
 * @returns True if the platform is iPad, false otherwise.
 */
export function isIPad() {
  return (
    testPlatform(/^iPad/i) ||
    // iPadOS 13 lies and says it's a Mac, but we can distinguish by detecting touch support.
    (isMac() && navigator.maxTouchPoints > 1)
  );
}

/**
 * Checks if the current platform is iOS.
 * @returns True if the platform is iOS, false otherwise.
 */
export function isIOS() {
  return isIPhone() || isIPad();
}

/**
 * Checks if the current platform is Apple.
 * @returns True if the platform is Apple, false otherwise.
 */
export function isAppleDevice() {
  return isMac() || isIOS();
}

export function currentlyInDev() {
  toast.info("This feature is currently in development.", {
    description: "We're working on it and it'll be available soon.",
  });
}
