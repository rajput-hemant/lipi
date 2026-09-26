import type { NextConfig } from "next";

// This is validation for the environment variables early in the build process.
import "./lib/env";

const isDocker = process.env.IS_DOCKER === "true";

const config: NextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  reactCompiler: true,
  typedRoutes: true,
  images: {
    remotePatterns: [],
    unoptimized: !isDocker,
  },

  output: isDocker ? "standalone" : undefined,
};

export default config;
