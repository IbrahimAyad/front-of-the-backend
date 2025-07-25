import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry for error monitoring
export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️ SENTRY_DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Filter out health check requests
    beforeSend(event) {
      // Don't send health check errors
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      return event;
    },
    
    // Add release information if available
    release: process.env.RAILWAY_DEPLOYMENT_ID || process.env.npm_package_version,
  });

  console.log('✅ Sentry initialized for error monitoring');
}

// Custom error capture with context
export function captureError(error: Error, context?: any) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('error_context', context);
    }
    Sentry.captureException(error);
  });
}

// Capture API errors with request context
export function captureApiError(error: Error, request: any) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'api_error');
    scope.setContext('request', {
      method: request.method,
      url: request.url,
      headers: request.headers,
      query: request.query,
      params: request.params,
      ip: request.ip
    });
    Sentry.captureException(error);
  });
}

// Capture database errors
export function captureDbError(error: Error, query?: string) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'database_error');
    if (query) {
      scope.setContext('database', {
        query: query.substring(0, 500) // Limit query length
      });
    }
    Sentry.captureException(error);
  });
}

// Capture business logic errors
export function captureBusinessError(error: Error, operation: string, details?: any) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'business_error');
    scope.setTag('operation', operation);
    if (details) {
      scope.setContext('business_context', details);
    }
    Sentry.captureException(error);
  });
}

// Performance monitoring helpers
export function startTransaction(name: string, operation: string) {
  return Sentry.startSpan({
    name,
    op: operation,
  }, () => {
    // Transaction body will be handled by the caller
  });
}

export { Sentry }; 