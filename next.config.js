/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

module.exports = nextConfig 