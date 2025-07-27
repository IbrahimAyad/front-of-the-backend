import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { createApiResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { AppointmentType, AppointmentStatus } from '@prisma/client'

// GET /api/appointments/[id] - Protected endpoint (ALL authenticated users)
export const GET = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const appointment = await prisma.appointment.findUnique({
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
            measurements: {
              orderBy: { dateRecorded: 'desc' },
              take: 1
            }
          }
        }
      }
    })
    
    if (!appointment) {
      return createApiResponse({
        error: 'Appointment not found',
        status: 404
      })
    }
    
    return createApiResponse({
      data: appointment
    })
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return createApiResponse({
      error: 'Failed to fetch appointment',
      status: 500
    })
  }
})

// PUT /api/appointments/[id] - Protected endpoint (ALL authenticated users)
export const PUT = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Check if appointment exists
    const existing = await prisma.appointment.findUnique({
      where: { id: params.id }
    })
    
    if (!existing) {
      return createApiResponse({
        error: 'Appointment not found',
        status: 404
      })
    }
    
    // Validate enum values if provided
    if (body.type && !Object.values(AppointmentType).includes(body.type)) {
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
    
    // Parse and validate dates if provided
    const updateData: any = {
      customerId: body.customerId,
      type: body.type,
      status: body.status,
      notes: body.notes
    }
    
    if (body.date) {
      updateData.date = new Date(body.date)
      if (isNaN(updateData.date.getTime())) {
        return createApiResponse({
          error: 'Invalid date format',
          status: 400
        })
      }
    }
    
    if (body.startTime) {
      updateData.startTime = new Date(body.startTime)
      if (isNaN(updateData.startTime.getTime())) {
        return createApiResponse({
          error: 'Invalid start time format',
          status: 400
        })
      }
    }
    
    if (body.endTime) {
      updateData.endTime = new Date(body.endTime)
      if (isNaN(updateData.endTime.getTime())) {
        return createApiResponse({
          error: 'Invalid end time format',
          status: 400
        })
      }
    }
    
    // Validate time logic
    if (updateData.endTime && updateData.startTime && updateData.endTime <= updateData.startTime) {
      return createApiResponse({
        error: 'End time must be after start time',
        status: 400
      })
    }
    
    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
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
      data: appointment
    })
  } catch (error) {
    console.error('Error updating appointment:', error)
    return createApiResponse({
      error: 'Failed to update appointment',
      status: 500
    })
  }
})

// DELETE /api/appointments/[id] - Protected endpoint (ADMIN/STAFF only)
export const DELETE = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Check if appointment exists
    const existing = await prisma.appointment.findUnique({
      where: { id: params.id }
    })
    
    if (!existing) {
      return createApiResponse({
        error: 'Appointment not found',
        status: 404
      })
    }
    
    // Instead of hard delete, update status to CANCELLED
    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: AppointmentStatus.CANCELLED }
    })
    
    return createApiResponse({
      data: { 
        message: 'Appointment cancelled successfully',
        appointment
      }
    })
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return createApiResponse({
      error: 'Failed to cancel appointment',
      status: 500
    })
  }
}, { requireRole: 'ADMIN' })