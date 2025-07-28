import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/dashboard/recent - Recent activities
export async function GET(request: NextRequest) {
  try {
    let recentOrders: any[] = [];
    let recentLeads: any[] = [];
    let recentAppointments: any[] = [];

    try {
      recentOrders = await prisma.order.findMany({
        take: 10,
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
    }

    try {
      recentLeads = await prisma.lead.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
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
      console.warn('Failed to fetch recent leads:', e);
    }

    try {
      recentAppointments = await prisma.appointment.findMany({
        take: 10,
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
      console.warn('Failed to fetch recent appointments:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        recentOrders,
        recentLeads,
        recentAppointments,
      },
    });
  } catch (error) {
    console.error('Dashboard recent error:', error);
    // Send empty data instead of failing
    return NextResponse.json({
      success: true,
      data: {
        recentOrders: [],
        recentLeads: [],
        recentAppointments: [],
      },
    });
  }
}