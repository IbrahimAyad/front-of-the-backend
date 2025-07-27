import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { createApiResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { AppointmentType, AppointmentStatus } from '@prisma/client'

// GET /api/appointments - Protected endpoint (ALL authenticated users)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // Build where clause
    const where: any = {}
    
    if (searchParams.get('status')) {
      where.status = searchParams.get('status') as AppointmentStatus
    }
    
    if (searchParams.get('type')) {
      where.type = searchParams.get('type') as AppointmentType
    }
    
    if (searchParams.get('customerId')) {
      where.customerId = searchParams.get('customerId')
    }
    
    // Date filtering
    if (searchParams.get('startDate') || searchParams.get('endDate')) {
      where.date = {}
      if (searchParams.get('startDate')) {
        where.date.gte = new Date(searchParams.get('startDate')!)
      }
      if (searchParams.get('endDate')) {
        where.date.lte = new Date(searchParams.get('endDate')!)
      }
    }
    
    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    // Fetch appointments with customer info
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
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
      prisma.appointment.count({ where })
    ])
    
    return createApiResponse({
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return createApiResponse({
      error: 'Failed to fetch appointments',
      status: 500
    })
  }
})

// POST /api/appointments - Protected endpoint (ALL authenticated users)
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.customerId || !body.date || !body.type) {
      return createApiResponse({
        error: 'customerId, date, and type are required',
        status: 400
      })
    }
    
    // Validate enum values
    if (!Object.values(AppointmentType).includes(body.type)) {
      return createApiResponse({
        error: 'Invalid appointment type',
        status: 400
      })
    }
    
    if (body.status && !Object.values(AppointmentStatus).includes(body.status)) {
      return createApiResponse({
        error: 'Invalid appointment status',
        status: 400
      })
    }
    
    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId }
    })
    
    if (!customer) {
      return createApiResponse({
        error: 'Customer not found',
        status: 404
      })
    }
    
    // Parse dates
    const appointmentDate = new Date(body.date)
    const startTime = body.startTime ? new Date(body.startTime) : appointmentDate
    const endTime = body.endTime ? new Date(body.endTime) : undefined
    
    // Validate dates
    if (isNaN(appointmentDate.getTime())) {
      return createApiResponse({
        error: 'Invalid date format',
        status: 400
      })
    }
    
    if (endTime && endTime <= startTime) {
      return createApiResponse({
        error: 'End time must be after start time',
        status: 400
      })
    }
    
    // Check for conflicting appointments
    if (endTime) {
      const conflicting = await prisma.appointment.findFirst({
        where: {
          AND: [
            { status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED] } },
            {
              OR: [
                {
                  AND: [
                    { date: { gte: appointmentDate } },
                    { date: { lt: endTime } }
                  ]
                },
                {
                  AND: [
                    { startTime: { gte: startTime } },
                    { startTime: { lt: endTime } }
                  ]
                }
              ]
            }
          ]
        }
      })
      
      if (conflicting) {
        return createApiResponse({
          error: 'Time slot conflicts with another appointment',
          status: 409
        })
      }
    }
    
    const appointment = await prisma.appointment.create({
      data: {
        customerId: body.customerId,
        date: appointmentDate,
        startTime,
        endTime,
        type: body.type,
        status: body.status || AppointmentStatus.SCHEDULED,
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
      data: appointment,
      status: 201
    })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return createApiResponse({
      error: 'Failed to create appointment',
      status: 500
    })
  }
})