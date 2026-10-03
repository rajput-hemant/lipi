import { env } from "@/lib/env";

export function resolveAuthRateLimitEnabled(): boolean | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  return env.DISABLE_AUTH_RATE_LIMIT === "true" ? false : undefined;
}
