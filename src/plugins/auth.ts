import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SERVER_CONFIG } from '../config/server';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
    requireRole: (roles: string[]) => (request: any, reply: any) => Promise<void>;
    hashPassword: (password: string) => Promise<string>;
    comparePassword: (password: string, hash: string) => Promise<boolean>;
    generateTokens: (userId: string) => { accessToken: string; refreshToken: string };
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      // Skip authentication for public endpoints
      if (request.url?.includes('/public') || request.url?.includes('/test') || request.url?.includes('/analytics')) {
        return;
      }
      
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        reply.code(401).send({ success: false, error: 'No token provided' });
        return;
      }

      const decoded = jwt.verify(token, SERVER_CONFIG.JWT_SECRET) as any;
      const user = await fastify.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true },
      });

      if (!user) {
        reply.code(401).send({ success: false, error: 'Invalid token' });
        return;
      }

      request.user = user;
    } catch (error) {
      reply.code(401).send({ success: false, error: 'Invalid token' });
    }
  });

  fastify.decorate('hashPassword', async (password: string) => {
    return bcrypt.hash(password, 12);
  });

  fastify.decorate('comparePassword', async (password: string, hash: string) => {
    try {
      fastify.log.info(`🔍 Comparing password with hash...`);
      fastify.log.info(`Input password length: ${password.length}`);
      fastify.log.info(`Hash length: ${hash.length}`);
      fastify.log.info(`Hash starts with: ${hash.slice(0, 7)}`);
      
      const result = await bcrypt.compare(password, hash);
      fastify.log.info(`🔍 bcrypt.compare result: ${result}`);
      return result;
    } catch (error) {
      fastify.log.error('💥 bcrypt.compare error:', error);
      throw error;
    }
  });

  fastify.decorate('generateTokens', (userId: string) => {
    const accessToken = jwt.sign({ userId }, SERVER_CONFIG.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, SERVER_CONFIG.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  });

  fastify.decorate('requireRole', (roles: string[]) => {
    return async (request: any, reply: any) => {
      if (!request.user) {
        reply.code(401).send({ success: false, error: 'Authentication required' });
        return;
      }

      if (!roles.includes(request.user.role)) {
        reply.code(403).send({ success: false, error: 'Insufficient permissions' });
        return;
      }
    };
  });
};

export default fp(authPlugin);
export { authPlugin };
