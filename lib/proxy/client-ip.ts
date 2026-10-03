import type { NextRequest } from "next/server";

const INTERNAL_HOP =
  /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|f[cd][0-9a-f]{2}:|fe80:)/i;

function trustedProxyCount(): number {
  if (process.env.VERCEL) return 0;
  const count = Number(process.env.TRUSTED_PROXY_COUNT);
  return Number.isInteger(count) && count > 0 ? count : 0;
}

// NextRequest has no `ip` since Next 15; the platform supplies it via headers.
// `x-real-ip` is set by the hosting platform (Vercel overwrites client values).
// For `x-forwarded-for`, clients can prepend arbitrary entries. With
// TRUSTED_PROXY_COUNT=N (off Vercel) only the right-most N hops are trusted and
// the client is hop N from the right. Otherwise walk from the right and take
// the first address that is not an internal hop.
export function getClientIp(req: NextRequest): string {
  const trustedProxies = trustedProxyCount();

  if (trustedProxies === 0) {
    const realIp = req.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }

  const hops = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);

  if (trustedProxies > 0) return hops.at(-trustedProxies) ?? "";

  return hops.findLast((hop) => !INTERNAL_HOP.test(hop)) ?? hops.at(-1) ?? "";
}
