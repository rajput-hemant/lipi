import createJiti from "jiti";

// This is validation for the environment variables early in the build process.
const jiti = createJiti(new URL(import.meta.url).pathname);
jiti("./lib/env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
    // unoptimized: true,
  },
  experimental: {
    typedRoutes: true,
  },
  output: "standalone",
  // ...
};

export default nextConfig;
