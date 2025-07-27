import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@/lib/cache/cacheService';

export interface CacheOptions {
  ttl?: number;
  key?: string | ((req: NextRequest) => string);
  condition?: (req: NextRequest) => boolean;
}

/**
 * Cache middleware for Next.js API routes
 * 
 * Usage:
 * export const GET = withCache(handler, { ttl: 300 });
 */
export function withCache(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  options: CacheOptions = {}
) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    // Check if caching should be applied
    if (options.condition && !options.condition(req)) {
      return handler(req, context);
    }

    // Generate cache key
    let cacheKey: string;
    if (options.key) {
      cacheKey = typeof options.key === 'function' 
        ? options.key(req) 
        : options.key;
    } else {
      // Default cache key based on URL and query params
      const url = new URL(req.url);
      cacheKey = `api:${url.pathname}:${url.search}`;
    }

    // Try to get from cache
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      // Return cached response with cache headers
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${options.ttl || 60}`,
        }
      });
    }

    // Execute handler
    const response = await handler(req, context);
    
    // Only cache successful responses
    if (response.ok) {
      try {
        // Clone response to read body
        const responseClone = response.clone();
        const data = await responseClone.json();
        
        // Store in cache
        await cacheService.set(cacheKey, data, options.ttl);
        
        // Return response with cache headers
        return NextResponse.json(data, {
          headers: {
            'X-Cache': 'MISS',
            'X-Cache-Key': cacheKey,
            'Cache-Control': `public, max-age=${options.ttl || 60}`,
          }
        });
      } catch (error) {
        console.error('Cache middleware error:', error);
        // Return original response if caching fails
        return response;
      }
    }

    return response;
  };
}

/**
 * Cache invalidation middleware for mutations
 */
export function withCacheInvalidation(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  patterns: string[] | ((req: NextRequest) => string[])
) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    const response = await handler(req, context);
    
    // Only invalidate on successful mutations
    if (response.ok && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const invalidationPatterns = typeof patterns === 'function' 
        ? patterns(req) 
        : patterns;
      
      for (const pattern of invalidationPatterns) {
        await cacheService.deletePattern(pattern);
      }
    }

    return response;
  };
}

/**
 * Performance tracking middleware
 */
export function withPerformanceTracking(
  handler: (req: NextRequest, context?: any) => Promise<Response>
) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    const startTime = Date.now();
    
    const response = await handler(req, context);
    
    const duration = Date.now() - startTime;
    
    // Add performance headers
    const headers = new Headers(response.headers);
    headers.set('X-Response-Time', `${duration}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn('Slow API request:', {
        method: req.method,
        url: req.url,
        duration
      });
    }
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  };
}

/**
 * Combined middleware for cache + performance
 */
export function withCacheAndPerformance(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  cacheOptions: CacheOptions = {}
) {
  return withPerformanceTracking(
    withCache(handler, cacheOptions)
  );
}