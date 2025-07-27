import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import path from 'path';
import { SERVER_CONFIG } from './config/server';

// Initialize monitoring and error handling
import { initSentry } from './utils/sentry';
import { initializeMonitoring, captureError } from './config/monitoring';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { setupSecurity, corsOptions } from './middleware/security';
import { connectRedis, disconnectRedis } from './services/cache/redisClient';

// Initialize monitoring systems
initSentry();
initializeMonitoring({
  sentryDsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  version: process.env.npm_package_version || '1.0.0',
  enableProfiling: process.env.NODE_ENV === 'production',
  enableTracing: process.env.NODE_ENV === 'production',
});

async function start() {
  const app: FastifyInstance = fastify({ 
    logger: false, // Use our Winston logger instead
    requestIdLogLabel: 'requestId',
    genReqId: () => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });

  try {
    // Set up error handler
    app.setErrorHandler(errorHandler);

    // Initialize Redis (optional - don't fail if Redis is unavailable)
    try {
      await connectRedis();
    } catch (error) {
      logger.warn('Redis connection failed, continuing without caching:', error);
    }

    // Security middleware (rate limiting, headers, etc.)
    await setupSecurity(app);

    // CORS - simplified registration
    await app.register(cors, {
      origin: true, // Allow all origins for now - can be restricted later
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
    });

    // JWT
    await app.register(jwt, {
      secret: SERVER_CONFIG.JWT_SECRET,
    });

    // WebSocket
    await app.register(websocket);

    // Custom plugins
    const databasePlugin = await import('./plugins/database');
    await app.register(databasePlugin.default);

    // Redis plugin (must be before cache)
    const redisPlugin = await import('./plugins/redis');
    await app.register(redisPlugin.default);

    const authPlugin = await import('./plugins/auth');
    await app.register(authPlugin.default);

    // Cache plugin (depends on database and redis)
    const cachePlugin = await import('./plugins/cache');
    await app.register(cachePlugin.default);

    // Performance monitoring plugin
    const performancePlugin = await import('./plugins/performance');
    await app.register(performancePlugin.default);

    const websocketPlugin = await import('./plugins/websocket');
    await app.register(websocketPlugin.default);

    // Routes
    const authRoutes = await import('./routes/auth');
    await app.register(authRoutes.default, { prefix: '/api/auth' });

    const dashboardRoutes = await import('./routes/dashboard');
    await app.register(dashboardRoutes.default, { prefix: '/api/dashboard' });

    const leadsRoutes = await import('./routes/leads');
    await app.register(leadsRoutes.default, { prefix: '/api/leads' });

    const customersRoutes = await import('./routes/customers');
    await app.register(customersRoutes.default, { prefix: '/api/customers' });

    const ordersRoutes = await import('./routes/orders');
    await app.register(ordersRoutes.default, { prefix: '/api/orders' });

    const appointmentsRoutes = await import('./routes/appointments');
    await app.register(appointmentsRoutes.default, { prefix: '/api/appointments' });

    const productsRoutes = await import('./routes/products');
    await app.register(productsRoutes.default, { prefix: '/api/products' });
    
    // Cached product routes
    const cachedProductRoutes = await import('./routes/products/cached');
    await app.register(cachedProductRoutes.default, { prefix: '/api/cached/products' });

    const suppliersRoutes = await import('./routes/suppliers');
    await app.register(suppliersRoutes.default, { prefix: '/api/suppliers' });

    // Import and register Restore routes
    const restoreRoutes = await import('./routes/restore');
    await app.register(restoreRoutes.default, { prefix: '/api/restore' });

    // Import and register Cleanup routes
    const cleanupRoutes = await import('./routes/cleanup');
    await app.register(cleanupRoutes.default, { prefix: '/api/cleanup' });

    // Import and register collection routes
    const collectionsRoutes = await import('./routes/collections');
    await app.register(collectionsRoutes.default, { prefix: '/api/collections' });

    // Import and register debug routes
    const debugRoutes = await import('./routes/debug');
    await app.register(debugRoutes.default, { prefix: '/api/debug' });

    // Import and register analytics routes  
    const analyticsRoutes = await import('./routes/analytics');
    await app.register(analyticsRoutes.default, { prefix: '/api/analytics' });

    // Skip multipart registration entirely to avoid decorator conflicts
    // Base64 uploads work fine via /api/cloudflare/upload-base64
    logger.info('ℹ️ Skipping multipart registration to prevent conflicts - using base64 uploads only');

    // Import and register Cloudflare routes
    const cloudflareRoutes = await import('./routes/cloudflare');
    await app.register(cloudflareRoutes.default, { prefix: '/api/cloudflare' });

    // Import and register Health routes
    const healthRoutes = await import('./routes/health');
    await app.register(healthRoutes.default);
    
    // Register cache invalidation hooks
    const { registerCacheInvalidationHooks, setupDatabaseCacheInvalidation } = await import('./hooks/cacheInvalidation');
    registerCacheInvalidationHooks(app);
    setupDatabaseCacheInvalidation(app);

    // Additional health check for database
    app.get('/health/db', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if ((app as any).prisma) {
          await (app as any).prisma.$queryRaw`SELECT 1`;
          return { healthy: true, database: 'connected' };
        } else {
          reply.status(503).send({ healthy: false, database: 'not_initialized' });
        }
      } catch (error) {
        reply.status(503).send({ 
          healthy: false, 
          database: 'error',
          message: (error as Error).message 
        });
      }
    });

    // Frontend serving in production - DISABLED for now
    // if (process.env.NODE_ENV === 'production') {
    //   // Serve static files from dist directory
    //   await app.register(import('@fastify/static'), {
    //     root: path.join(__dirname, '../dist'),
    //     prefix: '/',
    //   });

    //   // SPA fallback
    //   app.get('/*', async (request: FastifyRequest, reply: FastifyReply) => {
    //     return reply.sendFile('index.html');
    //   });
    // }

    // Determine port with fallback
    let port = SERVER_CONFIG.PORT;
    
    // Try to start the server
    try {
      await app.listen({ 
        host: '0.0.0.0', 
        port: port 
      });
      
      logger.info(`🚀 Server started successfully on port ${port}`);
      console.log(`🚀 Fastify server running on http://localhost:${port}`);
    } catch (err) {
      const error = err as Error;
      if (error.message.includes('EADDRINUSE')) {
        // Port is in use, try the next port
        port = port + 1;
        console.log(`⚠️ Port ${SERVER_CONFIG.PORT} is in use, using port ${port} instead`);
        
        await app.listen({ 
          host: '0.0.0.0', 
          port: port 
        });
        
        logger.info(`🚀 Server started on fallback port ${port}`);
        console.log(`🚀 Fastify server running on http://localhost:${port}`);
      } else {
        throw error;
      }
    }

  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await disconnectRedis();
  process.exit(0);
});

// Start the server
start().catch((error) => {
  logger.error('Server startup failed:', error);
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});