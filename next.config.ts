import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove unsupported experimental flags to avoid runtime warnings.
  images: {
    domains: ['placehold.co', 'images.unsplash.com'],
  },
  // Temporarily disable ESLint during build to work around ESLint option compatibility issues.
  eslint: {
    ignoreDuringBuilds: true,
  },
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
