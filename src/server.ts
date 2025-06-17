import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';

import { SERVER_CONFIG } from './config/server';
import { databasePlugin } from './plugins/database';
import { authPlugin } from './plugins/auth';
import { websocketPlugin } from './plugins/websocket';

// Routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import leadsRoutes from './routes/leads';
import customersRoutes from './routes/customers';
import ordersRoutes from './routes/orders';
import appointmentsRoutes from './routes/appointments';
import productsRoutes from './routes/products';
import measurementsRoutes from './routes/measurements';
import analyticsRoutes from './routes/analytics';
import mcpRoutes from './routes/mcp';
import askRoute from './routes/ask';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

// Port detection utility
async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = (server.address() as any)?.port;
      server.close(() => {
        resolve(port);
      });
    });
    
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try next port
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

async function start() {
  try {
    // Find available port starting from SERVER_CONFIG.PORT
    const availablePort = await findAvailablePort(SERVER_CONFIG.PORT || 8000);
    
    if (availablePort !== (SERVER_CONFIG.PORT || 8000)) {
      console.log(`⚠️  Port ${SERVER_CONFIG.PORT || 8000} is in use, using port ${availablePort} instead`);
    }

    await fastify.register(cors, {
      origin: [
        SERVER_CONFIG.FRONTEND_URL,
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3000',
        'http://localhost:4173',
        'https://kct-menswear-frontend-b0j1t22z6-ibrahimayads-projects.vercel.app',
        /\.vercel\.app$/,
        /\.railway\.app$/
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    await fastify.register(jwt, {
      secret: SERVER_CONFIG.JWT_SECRET,
    });

    await fastify.register(multipart, {
      limits: {
        fileSize: SERVER_CONFIG.UPLOAD_MAX_SIZE,
      },
    });

    await fastify.register(websocket);

    // Custom plugins
    await fastify.register(databasePlugin);
    await fastify.register(authPlugin);
    await fastify.register(websocketPlugin);

    // Routes
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(dashboardRoutes, { prefix: '/api/dashboard' });
    await fastify.register(leadsRoutes, { prefix: '/api/leads' });
    await fastify.register(customersRoutes, { prefix: '/api/customers' });
    await fastify.register(ordersRoutes, { prefix: '/api/orders' });
    await fastify.register(appointmentsRoutes, { prefix: '/api/appointments' });
    await fastify.register(productsRoutes, { prefix: '/api/products' });
    await fastify.register(measurementsRoutes, { prefix: '/api/measurements' });
    await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
    await fastify.register(mcpRoutes); // ✅ Mount MCP decision engine routes
    await fastify.register(askRoute); // ✅ Mount AI agents routes (includes /api/agents/* endpoints)

    // Health checks
    fastify.get('/health', async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
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
        measurements: '/api/measurements/*',
        appointments: '/api/appointments/*',
        analytics: '/api/analytics/*',
        mcp: '/api/mcp/*',
        ask: '/api/ask/*',
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