import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger';

// Security configuration
export async function setupSecurity(fastify: FastifyInstance) {
  // Security headers
  await fastify.register(import('@fastify/helmet'), {
    global: true,
    crossOriginEmbedderPolicy: false, // Allow Cloudflare images
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:", "*.cloudflare.com"],
        connectSrc: ["'self'", "https:", "wss:", "*.sentry.io"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https:"],
        frameSrc: ["'self'"]
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  });

  // Rate limiting
  await fastify.register(import('@fastify/rate-limit'), {
    global: true,
    max: (request) => {
      // Different limits for different endpoints
      if (request.url?.includes('/auth/login')) {
        return 5; // 5 login attempts per window
      }
      if (request.url?.includes('/api/')) {
        return 100; // 100 API calls per window
      }
      return 50; // Default limit
    },
    timeWindow: '1 minute',
    skipOnError: true,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true
    },
    errorResponseBuilder: (request, context) => {
      logger.warn('Rate limit exceeded', {
        ip: request.ip,
        url: request.url,
        userAgent: request.headers['user-agent']
      });
      
      return {
        success: false,
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.round(context.ttl / 1000)
      };
    }
  });

  // Custom security middleware
  fastify.addHook('onRequest', async (request, reply) => {
    // Add request ID for tracking
    request.id = generateRequestId();
    
    // Log suspicious requests
    if (isSuspiciousRequest(request)) {
      logger.warn('Suspicious request detected', {
        ip: request.ip,
        url: request.url,
        userAgent: request.headers['user-agent'],
        method: request.method,
        requestId: request.id
      });
    }
  });

  logger.info('✅ Security middleware configured');
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Detect suspicious requests
function isSuspiciousRequest(request: any): boolean {
  const suspiciousPatterns = [
    /\.(php|asp|jsp|cgi)$/i,
    /admin|phpmyadmin|wp-admin/i,
    /\.\./,
    /<script/i,
    /union.*select/i,
    /drop.*table/i
  ];

  const url = request.url?.toLowerCase() || '';
  const userAgent = request.headers['user-agent']?.toLowerCase() || '';

  // Check for suspicious URL patterns
  if (suspiciousPatterns.some(pattern => pattern.test(url))) {
    return true;
  }

  // Check for missing or suspicious user agents
  if (!userAgent || userAgent.includes('bot') || userAgent.includes('crawler')) {
    return false; // These are normal
  }

  // Check for SQL injection attempts in query parameters
  const queryString = request.url?.split('?')[1] || '';
  if (suspiciousPatterns.some(pattern => pattern.test(queryString))) {
    return true;
  }

  return false;
}

// IP whitelist middleware (for admin endpoints)
export function requireWhitelistedIP(allowedIPs: string[]) {
  return async (request: any, reply: any) => {
    const clientIP = request.ip;
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn('Unauthorized IP access attempt', {
        ip: clientIP,
        url: request.url,
        userAgent: request.headers['user-agent']
      });
      
      reply.status(403).send({
        success: false,
        error: 'FORBIDDEN',
        message: 'Access denied from this IP address'
      });
      return;
    }
  };
}

// API key validation middleware
export function requireApiKey() {
  return async (request: any, reply: any) => {
    const apiKey = request.headers['x-api-key'] || request.query.api_key;
    const validApiKey = process.env.API_KEY;
    
    if (!validApiKey) {
      logger.error('API_KEY not configured in environment');
      reply.status(500).send({
        success: false,
        error: 'CONFIGURATION_ERROR',
        message: 'Server configuration error'
      });
      return;
    }
    
    if (!apiKey || apiKey !== validApiKey) {
      logger.warn('Invalid API key attempt', {
        ip: request.ip,
        providedKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'none',
        url: request.url
      });
      
      reply.status(401).send({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Valid API key required'
      });
      return;
    }
  };
}

// CORS configuration for production
export const corsOptions = {
  origin: (origin: string, callback: Function) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://front-of-the-backend.vercel.app',
      'https://kctmenswear.com',
      ...(process.env.ADDITIONAL_ORIGINS?.split(',') || [])
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn('CORS blocked request', { origin });
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}; 