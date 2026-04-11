import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/storage/:path*',
        destination: 'https://xzwgnmzuyaukseypwdgh.supabase.co/storage/:path*',
      },
    ]
  },
};

export default nextConfig;
