import type { NextConfig } from "next";

const nextConfig = {
  output: 'export',
  basePath: '/fisica-trab', // ← nome exato do repo no GitHub
  images: {
    unoptimized: true,
  },
};

export default nextConfig;