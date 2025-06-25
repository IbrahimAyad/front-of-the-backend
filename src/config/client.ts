// Detect if we're in production - simplified logic
const isProduction = import.meta.env.PROD && 
                    (typeof window === 'undefined' || !window.location.hostname.includes('localhost'));

console.log('🔧 Environment Detection:', {
  'import.meta.env.PROD': import.meta.env.PROD,
  'window.location.hostname': typeof window !== 'undefined' ? window.location.hostname : 'server',
  'isProduction': isProduction,
});

export const CLIENT_CONFIG = {
  FRONTEND_URL: isProduction 
    ? 'https://kct-menswear-frontend.vercel.app'
    : (import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3003'),
  
  BACKEND_URL: isProduction 
    ? 'https://front-of-the-backend-production.up.railway.app'
    : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'),
  
  WS_BASE_URL: isProduction 
    ? 'wss://front-of-the-backend-production.up.railway.app/ws'
    : (import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/ws'),
  
  // Product Service APIs - use proxy in development to bypass CORS
  SUITS_API_URL: isProduction
    ? 'https://kct-suits-services-production.up.railway.app'
    : '/suits-api',
    
  TIES_API_URL: isProduction
    ? 'https://kct-ties-services-production.up.railway.app'
    : (import.meta.env.VITE_TIES_API_URL || 'https://kct-ties-services-production.up.railway.app'),
    
  VENDOR_API_URL: isProduction
    ? 'https://kct-vendor-sync-production.up.railway.app'
    : (import.meta.env.VITE_VENDOR_API_URL || 'https://kct-vendor-sync-production.up.railway.app'),
  
  // S3 Images Base URL
  IMAGES_BASE_URL: import.meta.env.VITE_IMAGES_BASE_URL || 'https://kct-product-images.s3.us-east-2.amazonaws.com',
  
  NODE_ENV: import.meta.env.VITE_NODE_ENV || (isProduction ? 'production' : 'development'),
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  ADMIN_EMAIL: import.meta.env.VITE_ADMIN_EMAIL || 'admin@kctmenswear.com',
  ADMIN_PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
};

// Export as default for backward compatibility
export default CLIENT_CONFIG;
