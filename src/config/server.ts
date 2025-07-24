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
  MACOS_ADMIN_API_KEY: process.env.MACOS_ADMIN_API_KEY || '452a711bbfd449a28a98756b69e14560',
  BACKEND_API_KEY: process.env.BACKEND_API_KEY || '0aadbad87424e6f468ce0fdb18d1462fd03b133c1b48fd805fab14d4bac3bd75',
};
