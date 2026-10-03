import { env } from "@/lib/env";
import { isEnvValidationSkipped } from "@/lib/env-flags";
import { ensureHttpsUrl } from "./ensure-https-url";

export function resolveAuthBaseURL() {
  const configured =
    ensureHttpsUrl(process.env.BETTER_AUTH_URL) ||
    ensureHttpsUrl(env.AUTH_URL) ||
    ensureHttpsUrl(process.env.AUTH_URL) ||
    ensureHttpsUrl(process.env.VERCEL_URL);

  if (configured) return configured;

  if (process.env.NODE_ENV === "production" && !isEnvValidationSkipped()) {
    throw new Error(
      "AUTH_URL or BETTER_AUTH_URL is required in production deployments"
    );
  }

  return "http://localhost:3000";
}
