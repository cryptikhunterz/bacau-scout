import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
// Deploy trigger: ${Date.now()} - force rebuild with enriched data
