import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // output: 'export', // Temporarily disable for dynamic routes
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    unoptimized: true,
  },
  // Ensure packages like pdfkit can load their own data files at runtime
  serverExternalPackages: ['pdfkit']
};

export default nextConfig;
