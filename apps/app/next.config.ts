import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensure images from external sources are properly handled
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: [
    '@ffprobe-installer/ffprobe',
    '@ffprobe-installer/linux-arm64',
    '@ffmpeg-installer/ffmpeg',
  ],
};

export default nextConfig;
