import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/orders/stats - Order statistics
export async function GET(request: NextRequest) {
  try {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      ordersByStatus
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'COMPLETED' }
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: parseFloat(totalRevenue._sum.total?.toString() || '0'),
        ordersByStatus: ordersByStatus.reduce((acc: any, item: any) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}