import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger';

export default async function analyticsRoutes(fastify: FastifyInstance) {
  // Health Check Endpoints for Production Monitoring
  fastify.get('/health', async (request, reply) => {
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  });

  fastify.get('/health/detailed', async (request, reply) => {
    const checks = {
      database: false,
      redis: false,
      server: true,
      timestamp: new Date().toISOString()
    };

    try {
      // Test database connection
      if (fastify.prisma) {
        await fastify.prisma.$queryRaw`SELECT 1`;
        checks.database = true;
      }
    } catch (error) {
      logger.error('Database health check failed:', error);
    }

    try {
      // Test Redis if available
      const { redisClient } = await import('../services/cache/redisClient');
      if (redisClient && redisClient.isOpen) {
        checks.redis = true;
      }
    } catch (error) {
      logger.warn('Redis health check failed:', error);
    }

    const allHealthy = checks.database && checks.server;
    
    return {
      success: allHealthy,
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: checks.timestamp
    };
  });

  fastify.get('/ready', async (request, reply) => {
    try {
      // Check if app is ready to serve traffic
      if (fastify.prisma) {
        await fastify.prisma.$queryRaw`SELECT 1`;
        return { ready: true, timestamp: new Date().toISOString() };
      }
      throw new Error('Database not available');
    } catch (error) {
      reply.code(503);
      return { 
        ready: false, 
        error: 'Service not ready',
        timestamp: new Date().toISOString()
      };
    }
  });

  fastify.get('/live', async (request, reply) => {
    // Simple liveness probe
    return { alive: true, timestamp: new Date().toISOString() };
  });

  // Analytics Routes for Production Monitoring
  fastify.get('/sales', async (request, reply) => {
    try {
      if (!fastify.prisma) {
        logger.warn('Database not available for sales analytics');
        return { 
          error: 'Database not available', 
          sales: [], 
          total: 0,
          timestamp: new Date().toISOString()
        };
      }

      // Mock sales data for now - replace with real queries
      const sales = [
        { id: 1, amount: 299, date: '2025-01-15', product: 'Classic Navy Suit' },
        { id: 2, amount: 89, date: '2025-01-14', product: 'Silk Burgundy Tie' },
        { id: 3, amount: 199, date: '2025-01-13', product: 'White Dress Shirt' }
      ];

      logger.info('Sales analytics requested', { count: sales.length });

      return {
        sales,
        total: sales.reduce((sum, sale) => sum + sale.amount, 0),
        count: sales.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Sales analytics error:', error);
      return {
        error: 'Failed to fetch sales data',
        sales: [],
        total: 0,
        timestamp: new Date().toISOString()
      };
    }
  });

  fastify.get('/leads', async (request, reply) => {
    try {
      if (!fastify.prisma) {
        logger.warn('Database not available for leads analytics');
        return { 
          error: 'Database not available', 
          leads: [], 
          total: 0,
          timestamp: new Date().toISOString()
        };
      }

      // Mock leads data for now - replace with real queries
      const leads = [
        { id: 1, name: 'John Smith', status: 'qualified', source: 'website' },
        { id: 2, name: 'Mike Johnson', status: 'contacted', source: 'referral' },
        { id: 3, name: 'David Brown', status: 'new', source: 'social' }
      ];

      logger.info('Leads analytics requested', { count: leads.length });

      return {
        leads,
        total: leads.length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Leads analytics error:', error);
      return {
        error: 'Failed to fetch leads data',
        leads: [],
        total: 0,
        timestamp: new Date().toISOString()
      };
    }
  });

  fastify.get('/overview', async (request, reply) => {
    try {
      if (!fastify.prisma) {
        logger.warn('Database not available for overview analytics');
        return { 
          error: 'Database not available',
          timestamp: new Date().toISOString()
        };
      }

      // Get real product count from database
      const productCount = await fastify.prisma.product.count();
      const userCount = await fastify.prisma.user.count();

      logger.info('Overview analytics requested', { productCount, userCount });

      return {
        products: productCount,
        users: userCount,
        sales: 3, // Mock data
        leads: 3, // Mock data
        revenue: 587, // Mock data
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Overview analytics error:', error);
      return {
        error: 'Failed to fetch overview data',
        products: 0,
        users: 0,
        sales: 0,
        leads: 0,
        revenue: 0,
        timestamp: new Date().toISOString()
      };
    }
  });

  // Error monitoring endpoint
  fastify.post('/error', async (request, reply) => {
    try {
      const { error, stack, userAgent, url } = request.body as any;
      
      logger.error('Frontend error reported:', {
        error,
        stack,
        userAgent,
        url,
        timestamp: new Date().toISOString(),
        ip: request.ip
      });

      return { success: true, logged: true };
    } catch (error) {
      logger.error('Failed to log frontend error:', error);
      return { success: false, error: 'Failed to log error' };
    }
  });
}
