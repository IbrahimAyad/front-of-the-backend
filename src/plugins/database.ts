import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  await prisma.$connect();

  // Run database migrations in production
  if (process.env.NODE_ENV === 'production') {
    try {
      fastify.log.info('🔧 Running database migrations...');
      await execAsync('npx prisma migrate deploy');
      fastify.log.info('✅ Database migrations completed');
      
      // Try to seed the database (ignore errors if already seeded)
      try {
        fastify.log.info('🌱 Seeding database...');
        await execAsync('npx prisma db seed');
        fastify.log.info('✅ Database seeding completed');
      } catch (seedError: any) {
        fastify.log.warn('⚠️ Database seeding skipped (may already be seeded):', seedError.message);
      }
    } catch (error: any) {
      fastify.log.error('❌ Database migration failed:', error.message);
      throw error;
    }
  }

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
};

export default fp(databasePlugin);
export { databasePlugin };
