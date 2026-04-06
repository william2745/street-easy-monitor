import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.streeteasy.com',
      },
    ],
  },
};

export default nextConfig;
