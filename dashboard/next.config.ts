import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  productionBrowserSourceMaps: false,
};

export default nextConfig;
