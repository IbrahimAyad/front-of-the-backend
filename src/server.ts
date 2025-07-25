import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import path from 'path';
import { SERVER_CONFIG } from './config/server';

// Initialize monitoring and error handling
import { initSentry } from './utils/sentry';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { setupSecurity, corsOptions } from './middleware/security';

// Initialize Sentry first
initSentry();

async function start() {
  const app: FastifyInstance = fastify({ 
    logger: false, // Use our Winston logger instead
    requestIdLogLabel: 'requestId',
    genReqId: () => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });

  try {
    // Set up error handler
    app.setErrorHandler(errorHandler);

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

    const authPlugin = await import('./plugins/auth');
    await app.register(authPlugin.default);

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

    // Register multipart support for file uploads (with robust duplicate prevention)
    try {
      // Comprehensive check for existing multipart registration
      const multipartRegistered = 
        app.hasDecorator('multipartErrors') || 
        app.hasDecorator('multipart') ||
        app.hasRequestDecorator('isMultipart') ||
        app.hasRequestDecorator('multipart');
      
      if (!multipartRegistered) {
        await app.register(import('@fastify/multipart'), {
          limits: {
            files: 10,
            fileSize: 10 * 1024 * 1024, // 10MB
          }
        });
        logger.info('✅ Multipart plugin registered successfully');
      } else {
        logger.info('ℹ️ Multipart plugin already registered, skipping registration');
      }
    } catch (multipartError) {
      // If there's ANY error with multipart, just skip it entirely
      logger.warn('⚠️ Multipart registration failed, continuing without it:', multipartError);
      logger.info('💡 Base64 image uploads will still work via /api/cloudflare/upload-base64');
    }

    // Import and register Cloudflare routes
    const cloudflareRoutes = await import('./routes/cloudflare');
    await app.register(cloudflareRoutes.default, { prefix: '/api/cloudflare' });

    // Import and register Health routes
    const healthRoutes = await import('./routes/health');
    await app.register(healthRoutes.default);

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

    // Frontend serving in production
    if (process.env.NODE_ENV === 'production') {
      // Serve static files from dist directory
      await app.register(import('@fastify/static'), {
        root: path.join(__dirname, '../dist'),
        prefix: '/',
      });

      // SPA fallback
      app.get('/*', async (request: FastifyRequest, reply: FastifyReply) => {
        return reply.sendFile('index.html');
      });
    }

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
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
start().catch((error) => {
  logger.error('Server startup failed:', error);
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});