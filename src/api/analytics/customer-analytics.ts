import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function registerCustomerAnalyticsRoutes(fastify: FastifyInstance) {
  // Customer metrics endpoint
  fastify.get('/api/analytics/customer-metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [totalCustomers, totalProfiles, vipCount] = await Promise.all([
        prisma.customer.count(),
        prisma.customerProfile.count(),
        prisma.customerProfile.count({ where: { vipStatus: true } }),
      ]);

      const aggregates = await prisma.customerProfile.aggregate({
        _sum: {
          totalSpent: true,
          totalOrders: true,
        },
        _avg: {
          averageOrderValue: true,
        },
      });

      // Calculate growth (mock data for now)
      const customerGrowth = 12.5;
      const revenueGrowth = 8.3;
      const aovGrowth = -2.1;
      const vipGrowth = 15;

      return reply.send({
        data: {
          totalCustomers,
          totalRevenue: aggregates._sum.totalSpent || 0,
          avgOrderValue: aggregates._avg.averageOrderValue || 0,
          vipCustomers: vipCount,
          customerGrowth,
          revenueGrowth,
          aovGrowth,
          vipGrowth,
        },
      });
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch customer metrics' });
    }
  });

  // Customer segments endpoint
  fastify.get('/api/analytics/customer-segments', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const segments = await prisma.customerSegment.findMany({
        select: {
          name: true,
          customerCount: true,
          avgOrderValue: true,
          totalRevenue: true,
        },
      });

      return reply.send({ data: segments });
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch customer segments' });
    }
  });

  // Time series data endpoint
  fastify.get('/api/analytics/time-series', async (request: FastifyRequest<{
    Querystring: { range: string }
  }>, reply: FastifyReply) => {
    try {
      const { range } = request.query;
      
      // For now, return mock data
      // In production, you would aggregate from orders and customer data
      const mockData = [];
      const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockData.push({
          date: date.toISOString().split('T')[0],
          customers: Math.floor(3000 + Math.random() * 400),
          revenue: Math.floor(30000 + Math.random() * 20000),
          orders: Math.floor(15 + Math.random() * 10),
        });
      }

      return reply.send({ data: mockData });
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch time series data' });
    }
  });

  // Top customers endpoint
  fastify.get('/api/analytics/top-customers', async (request: FastifyRequest<{
    Querystring: { limit?: string }
  }>, reply: FastifyReply) => {
    try {
      const limit = parseInt(request.query.limit || '10');
      
      const topCustomers = await prisma.customer.findMany({
        take: limit,
        include: {
          profile: true,
        },
        where: {
          profile: {
            isNot: null,
          },
        },
        orderBy: {
          profile: {
            totalSpent: 'desc',
          },
        },
      });

      const formattedCustomers = topCustomers.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalSpent: customer.profile?.totalSpent || 0,
        totalOrders: customer.profile?.totalOrders || 0,
        tier: customer.profile?.customerTier || 'Prospect',
        lastPurchase: customer.profile?.lastPurchaseDate || null,
      }));

      return reply.send({ data: formattedCustomers });
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch top customers' });
    }
  });

  // Size distribution endpoint
  fastify.get('/api/analytics/size-distribution', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get all profiles with sizes
      const profiles = await prisma.customerProfile.findMany({
        select: {
          jacketSize: true,
          pantsSize: true,
          shirtSize: true,
        },
      });

      // Count jacket sizes (most common metric)
      const sizeCount = new Map<string, number>();
      profiles.forEach(profile => {
        if (profile.jacketSize) {
          sizeCount.set(profile.jacketSize, (sizeCount.get(profile.jacketSize) || 0) + 1);
        }
      });

      const sizeDistribution = Array.from(sizeCount.entries())
        .map(([size, count]) => ({ size, count }))
        .sort((a, b) => a.size.localeCompare(b.size));

      return reply.send({ data: sizeDistribution });
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch size distribution' });
    }
  });

  // Occasion distribution endpoint
  fastify.get('/api/analytics/occasion-distribution', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const occasions = await prisma.customerProfile.groupBy({
        by: ['primaryOccasion'],
        _count: {
          primaryOccasion: true,
        },
        where: {
          primaryOccasion: {
            not: null,
          },
        },
      });

      const total = occasions.reduce((sum, occ) => sum + occ._count.primaryOccasion, 0);
      
      const occasionData = occasions.map(occ => ({
        name: occ.primaryOccasion || 'Unknown',
        value: occ._count.primaryOccasion,
        percentage: ((occ._count.primaryOccasion / total) * 100).toFixed(1),
      }));

      return reply.send({ data: occasionData });
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch occasion distribution' });
    }
  });

  // Customers list endpoint with filtering
  fastify.get('/api/customers', async (request: FastifyRequest<{
    Querystring: {
      page?: string;
      limit?: string;
      search?: string;
      tier?: string;
      vipOnly?: string;
      hasCompleteProfile?: string;
      occasion?: string;
    }
  }>, reply: FastifyReply) => {
    try {
      const page = parseInt(request.query.page || '1');
      const limit = parseInt(request.query.limit || '10');
      const skip = (page - 1) * limit;
      const { search, tier, vipOnly, hasCompleteProfile, occasion } = request.query;

      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (tier || vipOnly || hasCompleteProfile || occasion) {
        where.profile = {};
        if (tier) where.profile.customerTier = tier;
        if (vipOnly === 'true') where.profile.vipStatus = true;
        if (hasCompleteProfile === 'true') where.profile.sizeProfileCompleteness = 1;
        if (occasion) where.profile.primaryOccasion = occasion;
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          skip,
          take: limit,
          where,
          include: {
            profile: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        }),
        prisma.customer.count({ where }),
      ]);

      return reply.send({
        data: customers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch customers' });
    }
  });
}