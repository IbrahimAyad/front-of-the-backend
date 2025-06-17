export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '8000'),
  NODE_ENV: process.env.NODE_ENV || 'production',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/kct_menswear', 
  JWT_SECRET: process.env.JWT_SECRET || 'kct-production-jwt-secret-2024-secure-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'kct-production-refresh-secret-2024-secure-key',
  USE_MOCK_DATA: process.env.USE_MOCK_DATA === 'true',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://kct-menswear-frontend-b0j1t22z6-ibrahimayads-projects.vercel.app',
  API_BASE_URL: process.env.API_BASE_URL || 'https://front-of-the-backend-production.up.railway.app/api',
  WS_BASE_URL: process.env.WS_BASE_URL || 'wss://front-of-the-backend-production.up.railway.app/ws',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@kctmenswear.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB default
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'dummy-key-for-testing',
};
