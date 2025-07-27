import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { createApiResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { LeadStatus, LeadSource } from '@prisma/client'

// GET /api/leads/[id] - Protected endpoint (ALL authenticated users)
export const GET = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            addresses: true,
            orders: {
              select: {
                id: true,
                orderNumber: true,
                total: true,
                status: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 5
            },
            _count: {
              select: { orders: true }
            }
          }
        }
      }
    })
    
    if (!lead) {
      return createApiResponse({
        error: 'Lead not found',
        status: 404
      })
    }
    
    return createApiResponse({
      data: lead
    })
  } catch (error) {
    console.error('Error fetching lead:', error)
    return createApiResponse({
      error: 'Failed to fetch lead',
      status: 500
    })
  }
})

// PUT /api/leads/[id] - Protected endpoint (ALL authenticated users)
export const PUT = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Check if lead exists
    const existing = await prisma.lead.findUnique({
      where: { id: params.id }
    })
    
    if (!existing) {
      return createApiResponse({
        error: 'Lead not found',
        status: 404
      })
    }
    
    // Validate enum values if provided
    if (body.source && !Object.values(LeadSource).includes(body.source)) {
      return createApiResponse({
        error: 'Invalid lead source',
        status: 400
      })
    }
    
    if (body.status && !Object.values(LeadStatus).includes(body.status)) {
      return createApiResponse({
        error: 'Invalid lead status',
        status: 400
      })
    }
    
    // If customerId is being changed, verify new customer exists
    if (body.customerId && body.customerId !== existing.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: body.customerId }
      })
      
      if (!customer) {
        return createApiResponse({
          error: 'Customer not found',
          status: 404
        })
      }
    }
    
    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        customerId: body.customerId,
        source: body.source,
        status: body.status,
        value: body.value !== undefined ? parseFloat(body.value) : undefined,
        notes: body.notes
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    })
    
    return createApiResponse({
      data: lead
    })
  } catch (error) {
    console.error('Error updating lead:', error)
    return createApiResponse({
      error: 'Failed to update lead',
      status: 500
    })
  }
})

// DELETE /api/leads/[id] - Protected endpoint (ADMIN only)
export const DELETE = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Check if lead exists
    const existing = await prisma.lead.findUnique({
      where: { id: params.id }
    })
    
    if (!existing) {
      return createApiResponse({
        error: 'Lead not found',
        status: 404
      })
    }
    
    await prisma.lead.delete({
      where: { id: params.id }
    })
    
    return createApiResponse({
      data: { message: 'Lead deleted successfully' }
    })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return createApiResponse({
      error: 'Failed to delete lead',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })