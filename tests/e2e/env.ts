export const E2E_PG_CONTAINER = "lipi-p9-e2e-pg";
export const E2E_PG_PORT = 5544;
export const E2E_APP_PORT = 3100;
export const E2E_REALTIME_PORT = 1235;

export const E2E_DATABASE_URL = `postgresql://postgres:test@127.0.0.1:${E2E_PG_PORT}/postgres`;

export const E2E_APP_ORIGIN = `http://127.0.0.1:${E2E_APP_PORT}`;

export const E2E_AUTH_SECRET = "e2e-local-auth-secret-min-32-characters-long";

export function e2eProcessEnv(): Record<string, string> {
  return {
    NODE_ENV: "production",
    SKIP_ENV_VALIDATION: "true",
    DATABASE_URL: E2E_DATABASE_URL,
    AUTH_SECRET: E2E_AUTH_SECRET,
    BETTER_AUTH_SECRET: E2E_AUTH_SECRET,
    AUTH_URL: E2E_APP_ORIGIN,
    BETTER_AUTH_URL: E2E_APP_ORIGIN,
    NEXT_PUBLIC_APP_URL: E2E_APP_ORIGIN,
    NEXT_PUBLIC_LIPI_REALTIME_URL: `ws://127.0.0.1:${E2E_REALTIME_PORT}`,
    LIPI_REALTIME_PORT: String(E2E_REALTIME_PORT),
    LIPI_REALTIME_ADDRESS: "127.0.0.1",
    LIPI_REALTIME_ALLOWED_ORIGINS: `${E2E_APP_ORIGIN},http://localhost:${E2E_APP_PORT}`,
    ENABLE_RATE_LIMITING: "false",
    UPSTASH_REDIS_REST_URL: "",
    UPSTASH_REDIS_REST_TOKEN: "",
    GOOGLE_CLIENT_ID: "e2e-google-client-id",
    GOOGLE_CLIENT_SECRET: "e2e-google-client-secret",
    GITHUB_CLIENT_ID: "e2e-github-client-id",
    GITHUB_CLIENT_SECRET: "e2e-github-client-secret",
  };
}
