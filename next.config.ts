import type { NextConfig } from "next";

// This is validation for the environment variables early in the build process.
import "./lib/env";

const isDocker = process.env.IS_DOCKER === "true";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
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
