// Environment detection - check if we're in a Vite environment
const isViteEnvironment = typeof globalThis !== 'undefined' && 
  typeof (globalThis as any).import !== 'undefined' &&
  typeof (globalThis as any).import.meta !== 'undefined';

// Frontend config (Vite) - only available in browser/Vite context
export const frontendConfig = {
  USE_MOCK_DATA: false, // Frontend will use environment variables directly
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3001',
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000/ws',
  // Railway production URLs
  RAILWAY_BACKEND_URL: 'https://front-of-the-backend-production.up.railway.app',
  RAILWAY_WEBSOCKET_URL: 'wss://front-of-the-backend-production.up.railway.app/ws',
};

// Backend config (Node.js) - only available in Node.js context
export const backendConfig = {
  PORT: parseInt(process.env.PORT || '8000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/kct_menswear',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
  USE_MOCK_DATA: process.env.USE_MOCK_DATA === 'true',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000',
  WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'ws://localhost:8000/ws',
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB default
};
