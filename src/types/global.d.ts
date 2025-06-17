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
  readonly VITE_FRONTEND_URL?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_WEBSOCKET_URL?: string;
  readonly VITE_USE_MOCK_DATA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 