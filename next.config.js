/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Railway deployment
  output: 'standalone',
  
  // Reduce memory usage during build
  swcMinify: true,
  compress: true,
  
  // Disable static optimization to prevent resource exhaustion
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Reduce worker threads to prevent resource exhaustion
    workerThreads: false,
    cpus: 1,
  },
  
  // Force dynamic rendering for all routes
  // This prevents the build from trying to statically generate pages
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
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
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle node modules that need to be external
    if (isServer) {
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
        'ioredis': 'commonjs ioredis',
      });
    }
    
    // Reduce parallelism to prevent resource exhaustion
    config.parallelism = 1;
    
    return config;
  },
};

module.exports = nextConfig;