import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { createApiResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { LeadStatus, LeadSource } from '@prisma/client'

// GET /api/leads - Protected endpoint (ALL authenticated users)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // Build where clause
    const where: any = {}
    
    if (searchParams.get('status')) {
      where.status = searchParams.get('status') as LeadStatus
    }
    
    if (searchParams.get('source')) {
      where.source = searchParams.get('source') as LeadSource
    }
    
    if (searchParams.get('customerId')) {
      where.customerId = searchParams.get('customerId')
    }
    
    if (searchParams.get('search')) {
      where.OR = [
        { customer: { email: { contains: searchParams.get('search')!, mode: 'insensitive' } } },
        { customer: { firstName: { contains: searchParams.get('search')!, mode: 'insensitive' } } },
        { customer: { lastName: { contains: searchParams.get('search')!, mode: 'insensitive' } } },
        { notes: { contains: searchParams.get('search')!, mode: 'insensitive' } }
      ]
    }
    
    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    // Fetch leads with customer info
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.lead.count({ where })
    ])
    
    return createApiResponse({
      data: leads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return createApiResponse({
      error: 'Failed to fetch leads',
      status: 500
    })
  }
})

// POST /api/leads - Protected endpoint (ALL authenticated users)
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.source) {
      return createApiResponse({
        error: 'source is required',
        status: 400
      })
    }
    
    // Validate enum values
    if (!Object.values(LeadSource).includes(body.source)) {
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
    
    // If customerId is provided, verify customer exists
    if (body.customerId) {
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
    
    const lead = await prisma.lead.create({
      data: {
        customerId: body.customerId,
        source: body.source,
        status: body.status || LeadStatus.NEW,
        value: body.value ? parseFloat(body.value) : undefined,
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
      data: lead,
      status: 201
    })
  } catch (error) {
    console.error('Error creating lead:', error)
    return createApiResponse({
      error: 'Failed to create lead',
      status: 500
    })
  }
})