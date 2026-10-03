import type { NextConfig } from "next";

// This is validation for the environment variables early in the build process.
import "./lib/env";

import { getRealtimeUrl } from "./lib/realtime/client";
import { buildCsp, CSP_REPORT_ONLY_HEADER } from "./lib/security/csp";

const isDocker = process.env.IS_DOCKER === "true";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: CSP_REPORT_ONLY_HEADER,
    value: buildCsp({
      isDev: process.env.NODE_ENV === "development",
      realtimeUrl: getRealtimeUrl(),
    }),
  },
];

const config: NextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  reactCompiler: true,
  typedRoutes: true,
  images: {
    remotePatterns: [],
    unoptimized: !isDocker,
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  output: isDocker ? "standalone" : undefined,
};

export default config;
