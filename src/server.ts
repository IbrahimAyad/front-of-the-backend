import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { SERVER_CONFIG } from './config/server';

// Initialize monitoring and error handling
import { initSentry } from './utils/sentry';
import { logger, apiLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { setupSecurity, corsOptions } from './middleware/security';

// Initialize Sentry first
initSentry();

async function start() {
  const app = fastify({ 
    logger: false, // Use our Winston logger instead
    requestIdLogLabel: 'requestId',
    genReqId: () => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });

  try {
    // Set up error handler
    app.setErrorHandler(errorHandler);

    // Security middleware (rate limiting, headers, etc.)
    await setupSecurity(app);

    // CORS
    await app.register(cors, corsOptions);

    // File upload plugin moved to Cloudflare section to avoid duplicate registration

    await app.register(websocket);

    // Custom plugins
    await app.register(databasePlugin);
    await app.register(authPlugin);
    await app.register(websocketPlugin);
    // await fastify.register(syncSchedulerPlugin); // FUTURE: MacOS Admin sync

    // Routes
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(dashboardRoutes, { prefix: '/api/dashboard' });
    await fastify.register(leadsRoutes, { prefix: '/api/leads' });
    await fastify.register(customersRoutes, { prefix: '/api/customers' });
    await fastify.register(ordersRoutes, { prefix: '/api/orders' });
    await fastify.register(appointmentsRoutes, { prefix: '/api/appointments' });
    await fastify.register(productsRoutes, { prefix: '/api/products' });
    await fastify.register(suppliersRoutes, { prefix: '/api/suppliers' });
    await fastify.register(measurementsRoutes, { prefix: '/api/measurements' });
    await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
    await fastify.register(mcpRoutes); // ✅ Mount MCP decision engine routes
    await fastify.register(askRoute); // ✅ Mount AI agents routes (includes /api/agents/* endpoints)
    
    // Import and register restore routes
    const restoreRoutes = await import('./routes/restore');
    await fastify.register(restoreRoutes.default, { prefix: '/api/restore' });
    
    // Import and register collection routes
    const collectionsRoutes = await import('./routes/collections');
    await fastify.register(collectionsRoutes.default, { prefix: '/api/collections' });
    
    // Register multipart support for file uploads (with robust duplicate prevention)
    try {
      // Comprehensive check for existing multipart registration
      const multipartRegistered = 
        fastify.hasDecorator('multipartErrors') || 
        fastify.hasDecorator('multipart') ||
        fastify.hasRequestDecorator('isMultipart') ||
        fastify.hasRequestDecorator('multipart');
      
      if (!multipartRegistered) {
        await fastify.register(import('@fastify/multipart'), {
          limits: {
            files: 10,
            fileSize: 10 * 1024 * 1024, // 10MB
          }
        });
        fastify.log.info('✅ Multipart plugin registered successfully');
      } else {
        fastify.log.info('ℹ️ Multipart plugin already registered, skipping registration');
      }
    } catch (multipartError) {
      // If there's ANY error with multipart, just skip it entirely
      fastify.log.warn('⚠️ Multipart registration failed, continuing without it:', multipartError);
      fastify.log.info('💡 Base64 image uploads will still work via /api/cloudflare/upload-base64');
    }

    // Import and register Cloudflare routes
    const cloudflareRoutes = await import('./routes/cloudflare');
    await fastify.register(cloudflareRoutes.default, { prefix: '/api/cloudflare' });
    
    // Import and register cleanup routes
    const cleanupRoutes = await import('./routes/cleanup');
    await fastify.register(cleanupRoutes.default, { prefix: '/api/cleanup' });
    
    // await fastify.register(syncRoutes, { prefix: '/api/sync' }); // Temporarily disabled
    // await fastify.register(webhooksRoutes, { prefix: '/api/webhooks' }); // Temporarily disabled
    // await fastify.register(outfitsRoutes, { prefix: '/api/outfits' }); // Temporarily disabled

    // Health checks
    fastify.get('/health', async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '22b9088a', // Latest commit hash
      environment: process.env.NODE_ENV || 'development',
    }));

    fastify.get('/health/database', async (request, reply) => {
      try {
        await fastify.prisma.$queryRaw`SELECT 1`;
        return { status: 'ok', database: 'connected' };
      } catch (error: any) {
        reply.code(503);
        return {
          status: 'error',
          database: 'disconnected',
          error: error.message,
        };
      }
    });

    // Root status info
    fastify.get('/', async () => ({
      message: 'KCT Menswear Backend API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        auth: '/api/auth/*',
        dashboard: '/api/dashboard/*',
        customers: '/api/customers/*',
        leads: '/api/leads/*',
        orders: '/api/orders/*',
        products: '/api/products/*',
        suppliers: '/api/suppliers/*',
        measurements: '/api/measurements/*',
        appointments: '/api/appointments/*',
        analytics: '/api/analytics/*',
        mcp: '/api/mcp/*',
        ask: '/api/ask/*',
        sync: '/api/sync/*',
        webhooks: '/api/webhooks/*',
      },
    }));

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
      fastify.log.error(error);

      if (error.validation) {
        reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.validation,
        });
        return;
      }

      reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message || 'Internal Server Error',
      });
    });

    await fastify.listen({
      port: availablePort,
      host: '0.0.0.0',
    });

    console.log(`🚀 Fastify server running on http://localhost:${availablePort}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();