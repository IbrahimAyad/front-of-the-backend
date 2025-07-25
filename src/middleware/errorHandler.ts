import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { logger, apiLogger } from '../utils/logger';
import { captureApiError, captureError } from '../utils/sentry';

// Error response interface
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  requestId?: string;
  timestamp: string;
  details?: any;
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BusinessError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public query?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Main error handler
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log the error
  apiLogger.error(request, error);

  // Determine error type and status code
  let statusCode = 500;
  let errorType = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorType = 'VALIDATION_ERROR';
    message = error.message;
    details = { field: (error as any).field };
  } else if (error.name === 'BusinessError') {
    statusCode = 422;
    errorType = 'BUSINESS_ERROR';
    message = error.message;
    details = { code: (error as any).code };
  } else if (error.name === 'DatabaseError') {
    statusCode = 500;
    errorType = 'DATABASE_ERROR';
    message = 'Database operation failed';
    // Don't expose query details in production
    if (process.env.NODE_ENV !== 'production') {
      details = { query: (error as any).query };
    }
  } else if (error.statusCode) {
    // Fastify validation errors
    statusCode = error.statusCode;
    if (statusCode === 400) {
      errorType = 'BAD_REQUEST';
      message = 'Invalid request data';
      details = error.validation;
    } else if (statusCode === 401) {
      errorType = 'UNAUTHORIZED';
      message = 'Authentication required';
    } else if (statusCode === 403) {
      errorType = 'FORBIDDEN';
      message = 'Access denied';
    } else if (statusCode === 404) {
      errorType = 'NOT_FOUND';
      message = 'Resource not found';
    } else if (statusCode === 429) {
      errorType = 'RATE_LIMITED';
      message = 'Too many requests';
    }
  }

  // Capture error for monitoring (but not for 4xx client errors)
  if (statusCode >= 500) {
    captureApiError(error, request);
  }

  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: errorType,
    message,
    requestId: request.id,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (errorResponse as any).stack = error.stack;
  }

  // Send error response
  reply.status(statusCode).send(errorResponse);
}

// Async error wrapper for route handlers
export function asyncHandler(
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<any>
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return await handler(request, reply);
    } catch (error) {
      throw error; // Let Fastify's error handler catch it
    }
  };
}

// Health check error handler (lighter logging)
export async function healthCheckErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Don't log health check errors to Sentry
  logger.warn('Health check failed', {
    error: error.message,
    url: request.url
  });

  reply.status(503).send({
    success: false,
    error: 'SERVICE_UNAVAILABLE',
    message: 'Service health check failed',
    timestamp: new Date().toISOString()
  });
}

// Database connection error handler
export function handleDatabaseError(error: any, query?: string): never {
  const dbError = new DatabaseError(
    `Database operation failed: ${error.message}`,
    query
  );
  
  // Log to monitoring
  logger.error('Database Error', {
    error: error.message,
    query: query?.substring(0, 200),
    code: error.code
  });

  throw dbError;
}

// Business logic error handler
export function handleBusinessError(message: string, code?: string): never {
  const businessError = new BusinessError(message, code);
  
  logger.warn('Business Logic Error', {
    message,
    code
  });

  throw businessError;
}

// Validation error handler
export function handleValidationError(message: string, field?: string): never {
  const validationError = new ValidationError(message, field);
  
  logger.warn('Validation Error', {
    message,
    field
  });

  throw validationError;
} 