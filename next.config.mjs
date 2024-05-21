import createJiti from "jiti";

// This is validation for the environment variables early in the build process.
const jiti = createJiti(new URL(import.meta.url).pathname);
jiti("./lib/env");

const isProd = process.env.NODE_ENV === "production";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
    // unoptimized: true,
  },
  experimental: {
    reactCompiler: isProd,
    // ...
  },
  output: "standalone",
  /* ... */
};

export default config;
