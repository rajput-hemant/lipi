import { env } from "@/lib/env";
import { isEnvValidationSkipped } from "@/lib/env-flags";
import { ensureHttpsUrl } from "./ensure-https-url";

export function resolveAuthBaseURL() {
  const configured =
    ensureHttpsUrl(env.BETTER_AUTH_URL) || ensureHttpsUrl(env.VERCEL_URL);

  if (configured) return configured;

  if (process.env.NODE_ENV === "production" && !isEnvValidationSkipped()) {
    throw new Error("BETTER_AUTH_URL is required in production deployments");
  }

  return "http://localhost:3000";
}

const DEV_LOOPBACK_ORIGINS = ["http://localhost:*", "http://127.0.0.1:*"];

/**
 * Better Auth trusts only the base URL origin by default, so a dev server on
 * another port, or opened via 127.0.0.1, fails with "Invalid origin".
 */
export function resolveTrustedOrigins() {
  return process.env.NODE_ENV === "production" ? [] : DEV_LOOPBACK_ORIGINS;
}
