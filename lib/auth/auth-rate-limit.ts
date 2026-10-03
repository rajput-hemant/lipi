import { env } from "@/lib/env";

export function resolveAuthRateLimitEnabled(): boolean | undefined {
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }

  if (env.DISABLE_AUTH_RATE_LIMIT === "true") return false;
  return undefined;
}
