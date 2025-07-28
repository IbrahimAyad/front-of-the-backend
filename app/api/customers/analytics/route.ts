import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/customers/analytics - Customer analytics (no auth for dashboard)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    // Get customers with profiles and calculate analytics
    const [customers, total, analytics] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
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
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        },
      }),
      prisma.customer.count({ where }),
      prisma.customerProfile.aggregate({
        _count: { id: true },
        _avg: { engagementScore: true, totalSpent: true },
        _sum: { totalSpent: true, totalOrders: true },
      })
    ]);

    // Calculate tier distribution
    const tierDistribution = await prisma.customerProfile.groupBy({
      by: ['customerTier'],
      _count: { customerTier: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        analytics: {
          totalCustomers: total,
          averageEngagement: Math.round(analytics._avg.engagementScore || 0),
          totalRevenue: parseFloat(analytics._sum.totalSpent?.toString() || '0'),
          averageOrderValue: parseFloat(analytics._avg.totalSpent?.toString() || '0'),
          totalOrders: analytics._sum.totalOrders || 0,
          tierDistribution: tierDistribution.reduce((acc: any, tier: any) => {
            acc[tier.customerTier] = tier._count.customerTier;
            return acc;
          }, {} as Record<string, number>)
        }
      },
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer analytics' },
      { status: 500 }
    );
  }
}