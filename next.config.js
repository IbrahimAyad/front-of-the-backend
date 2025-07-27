/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Railway deployment
  output: 'standalone',
  
  // API routes configuration
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
  
  // Environment variables
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:8000',
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle node modules that need to be external
    if (isServer) {
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
        'ioredis': 'commonjs ioredis',
      });
    }
    return config;
  },
};

module.exports = nextConfig;