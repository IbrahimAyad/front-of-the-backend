import { FastifyPluginAsync } from 'fastify';
import { createCustomerSchema, updateCustomerSchema } from '../schemas/customer';

const customersRoutes: FastifyPluginAsync = async (fastify) => {
  // Production customer analytics endpoint (optimized for dashboard) - NO AUTH REQUIRED
  fastify.get('/analytics', async (request: any, reply) => {
    try {
      const { page = 1, limit = 100, search } = request.query;
      const skip = (page - 1) * limit;

      console.log('🔍 BACKEND: /analytics called with:', {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        skip,
        queryParams: request.query
      });

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ];
      }

      console.log('🔍 BACKEND: Prisma where clause:', where);

      // Get customers with profiles and calculate analytics
      const [customers, total, analytics] = await Promise.all([
        fastify.prisma.customer.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            profile: {
              select: {
                customerTier: true,
                engagementScore: true,
                vipStatus: true,
                totalSpent: true,
                totalOrders: true,
                averageOrderValue: true,
                lastPurchaseDate: true,
                daysSinceLastPurchase: true,
              }
            },
            orders: {
              select: { id: true, total: true, status: true, createdAt: true },
              take: 5, // Get more orders for better data
              orderBy: { createdAt: 'desc' }
            }
          },
        }),
        fastify.prisma.customer.count({ where }),
        fastify.prisma.customerProfile.aggregate({
          _count: { id: true },
          _avg: { engagementScore: true, totalSpent: true },
          _sum: { totalSpent: true, totalOrders: true },
        })
      ]);

      // Calculate tier distribution
      const tierDistribution = await fastify.prisma.customerProfile.groupBy({
        by: ['customerTier'],
        _count: { customerTier: true },
      });

      reply.send({
        success: true,
        data: {
          customers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
          analytics: {
            totalCustomers: total,
            averageEngagement: Math.round(analytics._avg.engagementScore || 0),
            totalRevenue: parseFloat(analytics._sum.totalSpent?.toString() || '0'),
            averageOrderValue: parseFloat(analytics._avg.totalSpent?.toString() || '0'),
            totalOrders: analytics._sum.totalOrders || 0,
            tierDistribution: tierDistribution.reduce((acc, tier) => {
              acc[tier.customerTier] = tier._count.customerTier;
              return acc;
            }, {} as Record<string, number>)
          }
        },
        cached: false, // Real-time data
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error('Customer analytics error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch customer analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test endpoint to verify route registration
  fastify.get('/test', async (request: any, reply) => {
    reply.send({ success: true, message: 'Customer routes are working!', timestamp: new Date() });
  });

  // Public endpoint for customer data (for development/dashboard)
  fastify.get('/public', async (request: any, reply) => {
    try {
      const { page = 1, limit = 50, search } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ];
      }

      const [customers, total] = await Promise.all([
        fastify.prisma.customer.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            profile: true, // Include customer profiles for enhanced data
          },
        }),
        fastify.prisma.customer.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          customers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Get customers with pagination (authenticated)
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 50, search } = request.query; // Increased default limit
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ];
      }

      const [customers, total] = await Promise.all([
        fastify.prisma.customer.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            profile: true, // Include customer profiles for enhanced data
          },
        }),
        fastify.prisma.customer.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          customers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Create new customer
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { error, value } = createCustomerSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const customer = await fastify.prisma.customer.create({
        data: value,
      });

      reply.code(201).send({
        success: true,
        data: {
          customer: customer  // Wrap customer in object for consistent API response
        }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({
          success: false,
          error: 'Customer with this email already exists',
        });
      }
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Get customer details
  fastify.get('/:id', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      
      // Validate ID parameter - check if it's a valid string ID
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return reply.code(400).send({
          success: false,
          error: 'Invalid customer ID'
        });
      }

      const customer = await fastify.prisma.customer.findUnique({
        where: { id: id },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          leads: {
            orderBy: { updatedAt: 'desc' },
            take: 5,
          },
          appointments: {
            orderBy: { date: 'desc' },
            take: 5,
          },
          measurements: {
            orderBy: { dateRecorded: 'desc' },
            take: 1,
          },
        },
      });

      if (!customer) {
        return reply.code(404).send({
          success: false,
          error: 'Customer not found',
        });
      }

      reply.send({
        success: true,
        data: customer,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });
};

export default customersRoutes;
