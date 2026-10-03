/**
 * Content-Security-Policy builder.
 *
 * Static (non-nonce) policy: nonces require dynamic rendering of every page,
 * which conflicts with `cacheComponents`. The trade-off is `'unsafe-inline'`
 * for scripts and styles, so this policy limits where resources load from and
 * blocks plugins, framing and base-URI tampering, but does not stop inline
 * script injection. It is only ever sent in report-only mode for now.
 *
 * @see node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
 */

export const CSP_REPORT_ONLY_HEADER = "Content-Security-Policy-Report-Only";

const STRIPE_SCRIPT = ["https://js.stripe.com"];
const STRIPE_CONNECT = ["https://api.stripe.com", "https://hooks.stripe.com"];
const STRIPE_FRAME = ["https://js.stripe.com", "https://hooks.stripe.com"];
const UPLOADTHING = [
  "https://utfs.io",
  "https://*.ufs.sh",
  "https://uploadthing.com",
  "https://*.uploadthing.com",
];
const AVATAR_IMAGES = [
  "https://lh3.googleusercontent.com",
  "https://avatars.githubusercontent.com",
];
const VERCEL_ANALYTICS_SCRIPT = ["https://va.vercel-scripts.com"];
const VERCEL_ANALYTICS_CONNECT = ["https://vitals.vercel-insights.com"];

export type CspOptions = {
  isDev?: boolean;
  /** Value of NEXT_PUBLIC_LIPI_REALTIME_URL (ws, wss, http or https). */
  realtimeUrl?: string | null;
};

/** Returns the ws(s) origin for the realtime host, or null if unusable. */
export function realtimeConnectSource(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") return `ws://${parsed.host}`;
    if (parsed.protocol === "https:") return `wss://${parsed.host}`;
    if (parsed.protocol === "ws:" || parsed.protocol === "wss:") {
      return `${parsed.protocol}//${parsed.host}`;
    }
  } catch {
    // An invalid URL adds no source.
  }
  return null;
}

export function buildCsp({ isDev = false, realtimeUrl }: CspOptions = {}) {
  const realtime = realtimeConnectSource(realtimeUrl);

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      ...STRIPE_SCRIPT,
      ...VERCEL_ANALYTICS_SCRIPT,
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "blob:", "data:", ...AVATAR_IMAGES, ...UPLOADTHING],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      ...STRIPE_CONNECT,
      ...UPLOADTHING,
      ...VERCEL_ANALYTICS_CONNECT,
      ...(realtime ? [realtime] : []),
      ...(isDev ? ["ws://localhost:*", "http://localhost:*"] : []),
    ],
    "frame-src": STRIPE_FRAME,
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}
