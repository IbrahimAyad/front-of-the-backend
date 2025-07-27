import { NextResponse } from 'next/server'
import { createApiResponse } from './api/response'
import { Prisma } from '@prisma/client'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  context?: string
}

/**
 * Standardized API error handler
 */
export function handleApiError(error: any, context: string = 'Unknown'): NextResponse {
  console.error(`[${context}] Error:`, {
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString()
  })

  // Prisma-specific errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return NextResponse.json(
          createApiResponse({
            error: 'A record with this value already exists',
            details: error.meta?.target
          }),
          { status: 409 }
        )
      
      case 'P2025': // Record not found
        return NextResponse.json(
          createApiResponse({
            error: 'Record not found'
          }),
          { status: 404 }
        )
      
      case 'P2003': // Foreign key constraint violation
        return NextResponse.json(
          createApiResponse({
            error: 'Related record not found'
          }),
          { status: 400 }
        )
      
      case 'P2014': // Required relation violated
        return NextResponse.json(
          createApiResponse({
            error: 'Cannot delete record with existing dependencies'
          }),
          { status: 400 }
        )
      
      default:
        return NextResponse.json(
          createApiResponse({
            error: 'Database operation failed'
          }),
          { status: 500 }
        )
    }
  }

  // Validation errors
  if (error.name === 'ValidationError' || error.name === 'ZodError') {
    return NextResponse.json(
      createApiResponse({
        error: 'Invalid input data',
        details: error.errors || error.issues
      }),
      { status: 400 }
    )
  }

  // Authentication errors
  if (error.message?.includes('Unauthorized') || error.statusCode === 401) {
    return NextResponse.json(
      createApiResponse({
        error: 'Authentication required'
      }),
      { status: 401 }
    )
  }

  // Authorization errors
  if (error.message?.includes('Forbidden') || error.statusCode === 403) {
    return NextResponse.json(
      createApiResponse({
        error: 'Insufficient permissions'
      }),
      { status: 403 }
    )
  }

  // Rate limiting
  if (error.message?.includes('Too Many Requests') || error.statusCode === 429) {
    return NextResponse.json(
      createApiResponse({
        error: 'Too many requests, please try again later'
      }),
      { status: 429 }
    )
  }

  // Business logic errors
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return NextResponse.json(
      createApiResponse({
        error: error.message || 'Bad request'
      }),
      { status: error.statusCode }
    )
  }

  // Default server error
  return NextResponse.json(
    createApiResponse({
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message || 'Internal server error'
    }),
    { status: 500 }
  )
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(
  handler: (req: any, context?: any) => Promise<NextResponse>
) {
  return async (req: any, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleApiError(error, 'AsyncHandler')
    }
  }
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  statusCode = 400
  
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  statusCode = 404
  
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401
  
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  statusCode = 403
  
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends Error {
  statusCode = 409
  
  constructor(message: string = 'Resource conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}

/**
 * Error reporting for monitoring
 */
export function reportError(error: Error, context: string, metadata?: any) {
  // In production, this would integrate with error tracking services
  // like Sentry, Bugsnag, or similar
  console.error('Error Report:', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    metadata,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
  
  // Could send to external service:
  // await sendToErrorTracker(error, context, metadata)
}