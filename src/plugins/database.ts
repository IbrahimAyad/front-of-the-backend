import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DatabasePool, getPool } from '../lib/connection-pool';
import { getSchemaAwareClient, SchemaAwareClient } from '../../lib/db/schema-aware-client';

const execAsync = promisify(exec);

declare module 'fastify' {
  interface FastifyInstance {
    prisma: SchemaAwareClient;
    dbPool: DatabasePool;
  }
}

// Database health check utility
async function initializeDatabasePool(dbPool: DatabasePool): Promise<void> {
  try {
    // Perform health check
    const health = await dbPool.checkHealth();
    
    if (!health.write.healthy) {
      throw new Error('Write pool health check failed');
    }
    
    console.log('✅ Database pools initialized successfully');
    console.log(`📊 Pool stats - Write: ${health.write.connections} connections, Read: ${health.read.connections} connections`);
  } catch (error: any) {
    throw new Error(`Failed to initialize database pools: ${error.message}`);
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  // Check if DATABASE_URL is properly configured
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('${{')) {
    fastify.log.warn('⚠️  DATABASE_URL not configured for local development');
    fastify.log.info('📋 To run locally, set DATABASE_URL in your environment');
    fastify.log.info('💡 Example: DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"');
    
    // Create a mock schema-aware client for development
    const mockPrisma = {
      // Schema-aware client methods
      getClient: () => ({
        $connect: async () => {},
        $disconnect: async () => {},
        $queryRaw: async () => [],
        user: { 
          findFirst: async () => null,
          findMany: async () => [],
          create: async (data: any) => ({ id: 'mock-id', ...data }),
          update: async (data: any) => ({ id: 'mock-id', ...data }),
          delete: async () => ({ id: 'mock-id' }),
          deleteMany: async () => ({ count: 0 }),
          count: async () => 0
        },
        customer: { 
          findMany: async () => [],
          findUnique: async () => null,
          create: async (data: any) => ({ id: 'mock-id', ...data }),
          update: async (data: any) => ({ id: 'mock-id', ...data }),
          delete: async () => ({ id: 'mock-id' }),
          deleteMany: async () => ({ count: 0 }),
          count: async () => 0,
          aggregate: async () => ({ _sum: {}, _avg: {}, _count: 0, _max: {}, _min: {} })
        },
        order: { 
          findMany: async () => [],
          findUnique: async () => null,
          create: async (data: any) => ({ id: 'mock-id', ...data }),
          update: async (data: any) => ({ id: 'mock-id', ...data }),
          delete: async () => ({ id: 'mock-id' }),
          deleteMany: async () => ({ count: 0 }),
          count: async () => 0,
          aggregate: async () => ({ _sum: {}, _avg: {}, _count: 0, _max: {}, _min: {} })
        },
        customerProfile: {
          findMany: async () => [],
          findUnique: async () => null,
          create: async (data: any) => ({ id: 'mock-id', ...data }),
          update: async (data: any) => ({ id: 'mock-id', ...data }),
          delete: async () => ({ id: 'mock-id' }),
          deleteMany: async () => ({ count: 0 }),
          count: async () => 0,
          aggregate: async () => ({ _sum: {}, _avg: {}, _count: 0, _max: {}, _min: {} }),
          groupBy: async () => []
        },
        lead: { 
          findMany: async () => [],
          create: async (data: any) => ({ id: 'mock-id', ...data }),
          deleteMany: async () => ({ count: 0 })
        },
        product: { 
          findMany: async () => [],
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
        },
        $transaction: async (fn: any) => fn({})
      }),
      // Schema-aware interface methods
      customers: { 
        findMany: async () => [],
        findUnique: async () => null,
        create: async (data: any) => ({ id: 'mock-id', ...data }),
        update: async (data: any) => ({ id: 'mock-id', ...data }),
        delete: async () => ({ id: 'mock-id' })
      },
      orders: { 
        findMany: async () => [],
        findUnique: async () => null,
        create: async (data: any) => ({ id: 'mock-id', ...data }),
        update: async (data: any) => ({ id: 'mock-id', ...data }),
        delete: async () => ({ id: 'mock-id' })
      },
      products: { 
        findMany: async () => [],
        findUnique: async () => null,
        create: async (data: any) => ({ id: 'mock-id', ...data }),
        update: async (data: any) => ({ id: 'mock-id', ...data }),
        delete: async () => ({ id: 'mock-id' })
      },
      query: async () => [],
      healthCheck: async () => ({ 
        public: true, 
        tenant_shared: true, 
        tenant_kct: true, 
        analytics: true 
      }),
      disconnect: async () => {}
    } as any;
    
    fastify.decorate('prisma', mockPrisma);
    fastify.log.info('🔧 Using mock database for local development');
    return;
  }

  // Initialize the schema-aware client
  const schemaAwareClient = getSchemaAwareClient();
  
  // Initialize the optimized database pool
  const dbPool = DatabasePool.getInstance();
  
  // Initialize and health check the pool
  await initializeDatabasePool(dbPool);
  
  // Decorate fastify instance with schema-aware client and dbPool
  fastify.decorate('prisma', schemaAwareClient);
  fastify.decorate('dbPool', dbPool);

  // Run migrations and seeding asynchronously after the plugin loads
  setImmediate(async () => {
    // Check if database tables exist and run migrations if needed
    try {
      // Test if users table exists
      await schemaAwareClient.getClient(true).user.findFirst();
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

  // Add health check endpoint
  fastify.get('/health/database', async (request, reply) => {
    try {
      const health = await dbPool.checkHealth();
      const stats = await dbPool.getStats();
      
      return {
        status: (health.write.healthy && health.read.healthy) ? 'healthy' : 'unhealthy',
        pools: health,
        connections: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      reply.status(503);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  });

  fastify.addHook('onClose', async (instance) => {
    fastify.log.info('🔌 Shutting down database pools...');
    await instance.dbPool.shutdown();
  });
};

export default fp(databasePlugin);
export { databasePlugin };
