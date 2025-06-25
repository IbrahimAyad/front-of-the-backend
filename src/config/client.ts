// Environment detection for server-side builds
const isProduction = process.env.NODE_ENV === 'production';

const getEnv = (key: string, fallback: string = '') => {
  return process.env[key] || fallback;
};

console.log('🔧 Environment Detection:', {
  'NODE_ENV': process.env.NODE_ENV,
  'isProduction': isProduction,
});

export const CLIENT_CONFIG = {
  FRONTEND_URL: isProduction 
    ? 'https://kct-menswear-frontend.vercel.app'
    : getEnv('VITE_FRONTEND_URL', 'http://localhost:3003'),
  
  BACKEND_URL: isProduction 
    ? 'https://front-of-the-backend-production.up.railway.app'
    : getEnv('VITE_API_BASE_URL', 'http://localhost:8000'),
  
  WS_BASE_URL: isProduction 
    ? 'wss://front-of-the-backend-production.up.railway.app/ws'
    : getEnv('VITE_WS_BASE_URL', 'ws://localhost:8000/ws'),
  
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
  
  NODE_ENV: getEnv('VITE_NODE_ENV', isProduction ? 'production' : 'development'),
  USE_MOCK_DATA: getEnv('VITE_USE_MOCK_DATA') === 'true',
  ADMIN_EMAIL: getEnv('VITE_ADMIN_EMAIL', 'admin@kctmenswear.com'),
  ADMIN_PASSWORD: getEnv('VITE_ADMIN_PASSWORD', 'admin123'),
};

// Export as default for backward compatibility
export default CLIENT_CONFIG;
