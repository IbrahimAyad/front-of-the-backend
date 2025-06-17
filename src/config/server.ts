export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '8000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/kct_menswear', 
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
  USE_MOCK_DATA: process.env.USE_MOCK_DATA === 'true',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB default
};
