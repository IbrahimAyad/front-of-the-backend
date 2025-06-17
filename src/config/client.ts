// Detect if we're in production based on hostname or NODE_ENV
const isProduction = import.meta.env.PROD || 
                    (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) ||
                    import.meta.env.VITE_NODE_ENV === 'production';

export const CLIENT_CONFIG = {
  FRONTEND_URL: isProduction 
    ? 'https://kct-menswear-frontend.vercel.app'
    : (import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3001'),
  
  BACKEND_URL: isProduction 
    ? 'https://front-of-the-backend-production.up.railway.app'
    : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'),
  
  WS_BASE_URL: isProduction 
    ? 'wss://front-of-the-backend-production.up.railway.app/ws'
    : (import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/ws'),
  
  NODE_ENV: import.meta.env.VITE_NODE_ENV || (isProduction ? 'production' : 'development'),
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  ADMIN_EMAIL: import.meta.env.VITE_ADMIN_EMAIL || 'admin@kctmenswear.com',
  ADMIN_PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
};
