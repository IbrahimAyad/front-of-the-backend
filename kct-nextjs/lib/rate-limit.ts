import { LRUCache } from 'lru-cache'
import { NextRequest, NextResponse } from 'next/server'
import { createApiResponse } from './api/response'

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max unique identifiers per interval
  tokensPerInterval?: number // Max requests per identifier per interval
}

interface TokenBucket {
  tokens: number
  lastRefill: number
  requests: number[]
}

class RateLimiter {
  private cache: LRUCache<string, TokenBucket>
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig) {
    this.config = {
      tokensPerInterval: 10,
      ...config,
    }

    this.cache = new LRUCache<string, TokenBucket>({
      max: this.config.uniqueTokenPerInterval,
      ttl: this.config.interval,
    })
  }

  private getIdentifier(req: NextRequest): string {
    // Try to get user ID from auth first
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      try {
        // Simple token parsing - in production you'd decode the JWT
        const token = authHeader.replace('Bearer ', '')
        return `user:${token.substring(0, 8)}` // Use first 8 chars as identifier
      } catch {
        // Fall through to IP-based limiting
      }
    }

    // Fall back to IP address
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded 
      ? forwarded.split(',')[0].trim()
      : req.headers.get('x-real-ip') || 'unknown'
    
    return `ip:${ip}`
  }

  private refillTokens(bucket: TokenBucket): void {
    const now = Date.now()
    const timePassed = now - bucket.lastRefill
    
    if (timePassed >= this.config.interval) {
      // Refill the bucket
      bucket.tokens = this.config.tokensPerInterval
      bucket.lastRefill = now
      bucket.requests = []
    } else {
      // Remove old requests outside the current window
      const windowStart = now - this.config.interval
      bucket.requests = bucket.requests.filter(timestamp => timestamp > windowStart)
    }
  }

  async check(req: NextRequest, limit?: number): Promise<boolean> {
    const identifier = this.getIdentifier(req)
    const requestLimit = limit || this.config.tokensPerInterval
    
    let bucket = this.cache.get(identifier)
    
    if (!bucket) {
      bucket = {
        tokens: requestLimit - 1,
        lastRefill: Date.now(),
        requests: [Date.now()],
      }
      this.cache.set(identifier, bucket)
      return true
    }

    this.refillTokens(bucket)

    // Check if we're under the limit
    if (bucket.requests.length < requestLimit) {
      bucket.requests.push(Date.now())
      bucket.tokens = Math.max(0, bucket.tokens - 1)
      return true
    }

    return false
  }

  getStats(): { size: number; max: number } {
    return {
      size: this.cache.size,
      max: this.cache.max || 0,
    }
  }
}

// Default rate limiters for different endpoint types
export const defaultLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  tokensPerInterval: 60, // 60 requests per minute
})

export const strictLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  tokensPerInterval: 10, // 10 requests per minute
})

export const authLimiter = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
  tokensPerInterval: 5, // 5 auth attempts per 15 minutes
})

/**
 * Rate limiting middleware wrapper
 */
export function withRateLimit(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  limiter: RateLimiter = defaultLimiter,
  limit?: number
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const allowed = await limiter.check(req, limit)
      
      if (!allowed) {
        return NextResponse.json(
          createApiResponse({
            error: 'Too many requests, please try again later',
            retryAfter: 60
          }),
          { 
            status: 429,
            headers: {
              'Retry-After': '60',
              'X-RateLimit-Limit': (limit || 60).toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': (Date.now() + 60000).toString(),
            }
          }
        )
      }

      return await handler(req, context)
    } catch (error) {
      console.error('Rate limit error:', error)
      // If rate limiting fails, allow the request through
      return await handler(req, context)
    }
  }
}

/**
 * Helper to create custom rate limiters
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config)
}

/**
 * Get rate limit stats for monitoring
 */
export function getRateLimitStats() {
  return {
    default: defaultLimiter.getStats(),
    strict: strictLimiter.getStats(),
    auth: authLimiter.getStats(),
  }
}