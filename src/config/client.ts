// Detect if we're in production based on hostname or NODE_ENV
const isProduction = import.meta.env.PROD || 
                    (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) ||
                    import.meta.env.VITE_NODE_ENV === 'production';

// Force production URLs when on Vercel domain
const isVercelDomain = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

export const CLIENT_CONFIG = {
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 
    (isProduction || isVercelDomain ? 'https://kct-menswear-frontend.vercel.app' : 'http://localhost:3001'),
  
  BACKEND_URL: import.meta.env.VITE_API_BASE_URL || 
    (isProduction || isVercelDomain ? 'https://front-of-the-backend-production.up.railway.app' : 'http://localhost:8000'),
  
  WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || 
    (isProduction || isVercelDomain ? 'wss://front-of-the-backend-production.up.railway.app/ws' : 'ws://localhost:8000/ws'),
  
  NODE_ENV: import.meta.env.VITE_NODE_ENV || (isProduction || isVercelDomain ? 'production' : 'development'),
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  ADMIN_EMAIL: import.meta.env.VITE_ADMIN_EMAIL || 'admin@kctmenswear.com',
  ADMIN_PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
};
