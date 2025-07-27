import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

// GET /api/dashboard/stats - Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Use individual try-catch for each query to handle failures gracefully
    let totalCustomers = 0;
    let totalOrders = 0;
    let totalLeads = 0;
    let pendingAppointments = 0;
    let recentOrders: any[] = [];

    try {
      totalCustomers = await prisma.customer.count();
    } catch (e) {
      console.warn('Failed to count customers:', e);
    }

    try {
      totalOrders = await prisma.order.count();
    } catch (e) {
      console.warn('Failed to count orders:', e);
    }

    try {
      totalLeads = await prisma.lead.count();
    } catch (e) {
      console.warn('Failed to count leads:', e);
    }

    try {
      pendingAppointments = await prisma.appointment.count({
        where: { status: 'SCHEDULED' },
      });
    } catch (e) {
      console.warn('Failed to count appointments:', e);
    }

    try {
      recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { 
            select: { 
              name: true,
              email: true 
            } 
          },
        },
      });
    } catch (e) {
      console.warn('Failed to fetch recent orders:', e);
      recentOrders = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        totalCustomers,
        totalOrders,
        totalLeads,
        pendingAppointments,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    // Send default data instead of failing
    return NextResponse.json({
      success: true,
      data: {
        totalCustomers: 0,
        totalOrders: 0,
        totalLeads: 0,
        pendingAppointments: 0,
        recentOrders: [],
      },
    });
  }
}