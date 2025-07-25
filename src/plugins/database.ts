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

// Database connection retry utility
async function connectWithRetry(prisma: PrismaClient, maxRetries: number = 5): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      
      // Test connection with a simple query
      await prisma.$queryRaw`SELECT 1`;
      
      console.log('✅ Database connected successfully');
      return;
    } catch (error: any) {
      console.log(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      
      if (i === maxRetries - 1) {
        throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s, 8s, 16s
      console.log(`⏳ Retrying database connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  // Check if DATABASE_URL is properly configured
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('${{')) {
    fastify.log.warn('⚠️  DATABASE_URL not configured for local development');
    fastify.log.info('📋 To run locally, set DATABASE_URL in your environment');
    fastify.log.info('💡 Example: DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"');
    
    // Create a mock prisma instance for development with all required methods
    const mockPrisma = {
      $connect: async () => {},
      $disconnect: async () => {},
      $queryRaw: async () => [],
      user: { 
        findFirst: async () => null,
        findMany: async () => [],
        create: async (data: any) => ({ id: 'mock-id', ...data }),
        update: async (data: any) => ({ id: 'mock-id', ...data }),
        delete: async () => ({ id: 'mock-id' }),
        deleteMany: async () => ({ count: 0 })
      },
      customer: { 
        findMany: async () => [],
        create: async (data: any) => ({ id: 'mock-id', ...data }),
        update: async (data: any) => ({ id: 'mock-id', ...data }),
        deleteMany: async () => ({ count: 0 })
      },
      order: { 
        findMany: async () => [],
        create: async (data: any) => ({ id: 'mock-id', ...data }),
        deleteMany: async () => ({ count: 0 })
      },
      lead: { 
        findMany: async () => [],
        create: async (data: any) => ({ id: 'mock-id', ...data }),
        deleteMany: async () => ({ count: 0 })
      },
      product: { 
        findMany: async () => ({ data: { products: [] } }),
        findUnique: async () => null,
        create: async (data: any) => ({ id: 'mock-id', ...data }),
        update: async (data: any) => ({ id: 'mock-id', ...data }),
        delete: async () => ({ id: 'mock-id' }),
        deleteMany: async () => ({ count: 0 }),
        count: async () => 0
      },
      productVariant: {
        create: async (data: any) => ({ id: 'mock-id', ...data }),
        deleteMany: async () => ({ count: 0 })
      },
      productImage: {
        create: async (data: any) => ({ id: 'mock-id', ...data }),
        deleteMany: async () => ({ count: 0 })
      },
      collection: {
        findMany: async () => [],
        findUnique: async () => null,
        create: async (data: any) => ({ id: 'mock-id', ...data }),
        deleteMany: async () => ({ count: 0 })
      },
      productCollection: {
        createMany: async () => ({ count: 0 }),
        deleteMany: async () => ({ count: 0 })
      }
    } as any;
    
    fastify.decorate('prisma', mockPrisma);
    fastify.log.info('🔧 Using mock database for local development');
    return;
  }

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
  });

  // Connect with retry logic
  await connectWithRetry(prisma);

  // Decorate fastify instance immediately after connection
  fastify.decorate('prisma', prisma);

  // Run migrations and seeding asynchronously after the plugin loads
  setImmediate(async () => {
    // Check if database tables exist and run migrations if needed
    try {
      // Test if users table exists
      await prisma.user.findFirst();
      fastify.log.info('✅ Database tables exist, skipping migrations');
    } catch (error: any) {
      if (error.message.includes('does not exist') || error.code === 'P2021') {
        fastify.log.info('🔧 Database tables missing, running migrations...');
        try {
          await execAsync('npx prisma migrate deploy');
          fastify.log.info('✅ Database migrations completed');
        } catch (migrationError: any) {
          fastify.log.error('❌ Database migration failed:', migrationError.message);
        }
      }
    }

    // Run database migrations in production (async)
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
      }
    }
  });

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
};

export default fp(databasePlugin);
export { databasePlugin };
