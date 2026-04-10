import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add this block to ignore ESLint errors during deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optionally ignore TypeScript errors during build too
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;