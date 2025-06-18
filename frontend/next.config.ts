import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/SignalBoard',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
