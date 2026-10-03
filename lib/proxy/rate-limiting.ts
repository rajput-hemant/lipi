// Reads process.env directly: proxy code is kept free of t3-env so it loads
// without the full schema (the proxy may run outside the app runtime).

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
