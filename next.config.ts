import type { NextConfig } from "next";

// This is validation for the environment variables early in the build process.
import "./lib/env";

const isDocker = process.env.IS_DOCKER === "true";
const isProd = process.env.NODE_ENV === "production";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
    unoptimized: !isDocker,
  },
  experimental: {
    ppr: true,
    reactCompiler: isProd,
    // ...
  },

  output: isDocker ? "standalone" : undefined /* ... */,
};

export default config;
