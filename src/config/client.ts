export const CLIENT_CONFIG = {
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'https://kct-menswear-frontend-b0j1t22z6-ibrahimayads-projects.vercel.app',
  BACKEND_URL: import.meta.env.VITE_API_BASE_URL || 'https://front-of-the-backend-production.up.railway.app/api',
  WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || 'wss://front-of-the-backend-production.up.railway.app/ws',
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'production',
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  ADMIN_EMAIL: import.meta.env.VITE_ADMIN_EMAIL || 'admin@kctmenswear.com',
  ADMIN_PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
};
