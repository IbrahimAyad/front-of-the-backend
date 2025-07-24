// Environment detection that works in both browser and server
const isServer = typeof window === 'undefined';
const isBrowser = typeof window !== 'undefined';

// Force production detection for Vercel deployments
const isProduction = isServer 
  ? process.env.NODE_ENV === 'production'
  : (isBrowser && (
      window.location?.hostname === 'kct-menswear-frontend.vercel.app' ||
      window.location?.hostname?.includes('vercel.app') || 
      window.location?.hostname?.includes('railway.app') ||
      window.location?.protocol === 'https:'
    ));

const getEnv = (key: string, fallback: string = '') => {
  // Server-side: use process.env
  if (isServer) {
    return process.env[key] || fallback;
  }
  // Browser-side: use import.meta.env (Vite environment)
  if (isBrowser) {
    try {
      // @ts-ignore - import.meta.env is available in browser builds
      return import.meta.env?.[key] || fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

// Enhanced debug logging
console.log('🔧 Frontend Configuration Debug:', {
  'isServer': isServer,
  'isBrowser': isBrowser,
  'hostname': isBrowser ? window.location?.hostname : 'server',
  'protocol': isBrowser ? window.location?.protocol : 'server',
  'isProduction': isProduction,
  'NODE_ENV': isServer ? process.env.NODE_ENV : 'browser',
  'Current URL': isBrowser ? window.location?.href : 'server'
});

export const CLIENT_CONFIG = {
  FRONTEND_URL: isProduction 
    ? 'https://kct-menswear-frontend.vercel.app'
    : getEnv('VITE_FRONTEND_URL', 'http://localhost:3003'),
  
  // Always use Railway for production, force it for Vercel
  BACKEND_URL: (isProduction || (isBrowser && window.location?.hostname?.includes('vercel.app')))
    ? 'https://front-of-the-backend-production.up.railway.app'
    : getEnv('VITE_API_BASE_URL', 'http://localhost:8000'),
  
  WS_BASE_URL: isProduction 
    ? 'wss://front-of-the-backend-production.up.railway.app/ws'
    : 'ws://localhost:8000/ws',
  
  // Product Service APIs
  SUITS_API_URL: isProduction
    ? 'https://kct-suits-services-production.up.railway.app'
    : '/suits-api',
    
  TIES_API_URL: isProduction
    ? 'https://kct-ties-services-production.up.railway.app'
    : getEnv('VITE_TIES_API_URL', 'https://kct-ties-services-production.up.railway.app'),
    
  VENDOR_API_URL: isProduction
    ? 'https://kct-vendor-sync-production.up.railway.app'
    : getEnv('VITE_VENDOR_API_URL', 'https://kct-vendor-sync-production.up.railway.app'),
  
  // S3 Images Base URL
  IMAGES_BASE_URL: getEnv('VITE_IMAGES_BASE_URL', 'https://kct-product-images.s3.us-east-2.amazonaws.com'),
  
  // Wedding API Integration
  WEDDING_API_URL: getEnv('VITE_WEDDING_API_URL', ''),
  
  NODE_ENV: getEnv('VITE_NODE_ENV', isProduction ? 'production' : 'development'),
  USE_MOCK_DATA: getEnv('VITE_USE_MOCK_DATA') === 'true',
  ADMIN_EMAIL: getEnv('VITE_ADMIN_EMAIL', 'admin@kctmenswear.com'),
  ADMIN_PASSWORD: getEnv('VITE_ADMIN_PASSWORD', 'admin123'),
};

// Export as default for backward compatibility
export default CLIENT_CONFIG;
