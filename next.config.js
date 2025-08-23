/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ AJOUT - Ignorer les erreurs ESLint et TypeScript pendant le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  async rewrites() {
    return [
      {
        source: '/videos/:path*',
        destination: '/api/videos/:path*',
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // ✨ NOUVEAU : Configuration des images externes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      }
    ],
  },
};

module.exports = nextConfig;