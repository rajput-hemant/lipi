import { env } from "@/lib/env";

export function resolveAuthBaseURL() {
  const configured =
    process.env.BETTER_AUTH_URL || env.AUTH_URL || process.env.AUTH_URL;

  if (configured) return configured;

  if (
    process.env.NODE_ENV === "production" &&
    process.env.SKIP_ENV_VALIDATION !== "true"
  ) {
    throw new Error(
      "AUTH_URL or BETTER_AUTH_URL is required in production deployments",
    );
  }

  return "http://localhost:3000";
}
