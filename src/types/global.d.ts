import { PrismaClient } from '@prisma/client';
import { AuthUser } from './auth';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
  interface FastifyRequest {
    user: AuthUser;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: AuthUser;
  }
}

// Vite environment variables
interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly VITE_FRONTEND_URL?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_WEBSOCKET_URL?: string;
  readonly VITE_USE_MOCK_DATA?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_BASE_URL?: string;
  readonly VITE_NODE_ENV?: string;
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  
  // Product Service APIs
  readonly VITE_SUITS_API_URL?: string;
  readonly VITE_TIES_API_URL?: string;
  readonly VITE_VENDOR_API_URL?: string;
  readonly VITE_IMAGES_BASE_URL?: string;
  readonly VITE_WEDDING_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 