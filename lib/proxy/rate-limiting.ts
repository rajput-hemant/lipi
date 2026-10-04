// Reads process.env on each call instead of the validated `env`: t3-env snapshots
// values at import time, which would freeze the per-test overrides in the proxy tests.

export type ProxyRateLimitMode = "disabled" | "active" | "misconfigured";

export function getProxyRateLimitMode(): ProxyRateLimitMode {
  if (process.env.ENABLE_RATE_LIMITING !== "true") return "disabled";
  if (process.env.NODE_ENV !== "production") return "disabled";
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return "misconfigured";
  }
  return "active";
}
