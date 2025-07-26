import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { logger } from '../utils/logger';

export interface MonitoringConfig {
  sentryDsn?: string;
  environment: string;
  version: string;
  enableProfiling: boolean;
  enableTracing: boolean;
}

export function initializeMonitoring(config: MonitoringConfig) {
  if (!config.sentryDsn) {
    logger.warn('⚠️ SENTRY_DSN not configured, skipping Sentry initialization');
    return;
  }

  try {
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.environment,
      release: config.version,
      
      // Performance monitoring
      tracesSampleRate: config.enableTracing ? 0.1 : 0,
      
      // Profiling
      profilesSampleRate: config.enableProfiling ? 0.1 : 0,
      
      integrations: [
        // Add profiling integration if enabled
        ...(config.enableProfiling ? [nodeProfilingIntegration()] : []),
        
        // HTTP integration for tracking API calls
        Sentry.httpIntegration(),
        
        // Express integration for web framework support
        Sentry.expressIntegration(),
      ],
      
      // Filter out sensitive data
      beforeSend(event, hint) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        
        // Remove sensitive data from extra context
        if (event.extra) {
          delete event.extra.password;
          delete event.extra.token;
          delete event.extra.jwt;
        }
        
        return event;
      },
      
      // Set user context
      beforeSendTransaction(event) {
        // Add custom tags for better filtering
        event.tags = {
          ...event.tags,
          service: 'kct-menswear-backend',
          version: config.version,
        };
        
        return event;
      },
    });

    logger.info('✅ Sentry monitoring initialized', {
      environment: config.environment,
      version: config.version,
      tracing: config.enableTracing,
      profiling: config.enableProfiling,
    });
  } catch (error) {
    logger.error('❌ Failed to initialize Sentry:', error);
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
  
  // Also log to our structured logger
  logger.error('Error captured by monitoring:', {
    error: error.message,
    stack: error.stack,
    context,
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
}

export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

export { Sentry }; 