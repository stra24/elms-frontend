import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_SERVER_HOST ?? ''],
  },
  transpilePackages: ['tiptap-markdown', 'markdown-it'],
};

export default nextConfig;
