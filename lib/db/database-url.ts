import { isEnvValidationSkipped } from "@/lib/env-flags";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export const MISSING_DATABASE_URL_MESSAGE =
  "DATABASE_URL is not set. Copy .env.example to .env.local (docs/local-development.md).";

export function isLoopbackDatabaseUrl(url: string | undefined) {
  if (!url) return false;
  try {
    return LOOPBACK_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function requireDatabaseUrl(databaseUrl: string | undefined) {
  if (!databaseUrl) throw new Error(MISSING_DATABASE_URL_MESSAGE);
  return databaseUrl;
}

export function requireLocalDatabaseUrl(databaseUrl: string | undefined) {
  const url = requireDatabaseUrl(databaseUrl);
  if (!isLoopbackDatabaseUrl(url)) {
    throw new Error(
      "Refusing to run: DATABASE_URL must point to localhost, 127.0.0.1 or ::1"
    );
  }
  return url;
}

export function assertDatabaseUrlConfigured(databaseUrl: string | undefined) {
  const skipped = isEnvValidationSkipped() || process.env.NODE_ENV === "test";
  if (!skipped && !databaseUrl) throw new Error(MISSING_DATABASE_URL_MESSAGE);
}
