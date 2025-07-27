import { LRUCache } from 'lru-cache'
import { User } from '@prisma/client'
import { AuthService } from './services/auth.service'

// Token verification cache (avoid repeated JWT decoding)
const tokenCache = new LRUCache<string, any>({
  max: 1000, // Cache 1000 tokens
  ttl: 1000 * 60 * 5, // 5 minutes
})

// User cache (avoid repeated DB lookups)
const userCache = new LRUCache<string, User>({
  max: 500,
  ttl: 1000 * 60 * 2, // 2 minutes
})

/**
 * Fast token verification with caching
 */
export async function verifyTokenFast(token: string): Promise<any> {
  // Check cache first
  const cached = tokenCache.get(token)
  if (cached) {
    return cached
  }

  // Verify and cache
  try {
    const decoded = AuthService.verifyToken(token)
    if (decoded) {
      tokenCache.set(token, decoded)
    }
    return decoded
  } catch (error) {
    // Don't cache failed tokens
    throw error
  }
}

/**
 * Get user with caching
 */
export async function getUserCached(userId: string): Promise<User | null> {
  // Check cache first
  const cached = userCache.get(userId)
  if (cached) {
    return cached
  }

  // Fetch from DB
  const { prisma } = await import('@/lib/prisma')
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (user) {
    userCache.set(userId, user as User)
  }

  return user as User | null
}

/**
 * Optimized getCurrentUser for high-traffic endpoints
 */
export async function getCurrentUserFast(req: Request): Promise<User | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  try {
    // Fast token verification
    const decoded = await verifyTokenFast(token)
    if (!decoded) return null

    // Get user with caching
    const userId = decoded.userId || decoded.id
    return await getUserCached(userId)
  } catch (error) {
    console.error('Fast auth error:', error)
    return null
  }
}

/**
 * Batch user fetching for analytics endpoints
 */
export async function getUsersBatch(userIds: string[]): Promise<Map<string, User>> {
  const users = new Map<string, User>()
  const uncachedIds: string[] = []

  // Check cache first
  for (const id of userIds) {
    const cached = userCache.get(id)
    if (cached) {
      users.set(id, cached)
    } else {
      uncachedIds.push(id)
    }
  }

  // Fetch uncached users in batch
  if (uncachedIds.length > 0) {
    const { prisma } = await import('@/lib/prisma')
    const fetchedUsers = await prisma.user.findMany({
      where: { id: { in: uncachedIds } },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    for (const user of fetchedUsers) {
      users.set(user.id, user as User)
      userCache.set(user.id, user as User)
    }
  }

  return users
}

/**
 * Clear user from cache (call after updates)
 */
export function invalidateUserCache(userId: string) {
  userCache.delete(userId)
}

/**
 * Clear token from cache (call after logout)
 */
export function invalidateTokenCache(token: string) {
  tokenCache.delete(token)
}

/**
 * Middleware for public endpoints that optionally use auth
 */
export async function optionalAuth(req: Request): Promise<User | null> {
  try {
    return await getCurrentUserFast(req)
  } catch {
    // If auth fails, continue as anonymous
    return null
  }
}

/**
 * Cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    tokens: {
      size: tokenCache.size,
      max: tokenCache.max,
      hits: tokenCache.calculatedSize,
    },
    users: {
      size: userCache.size,
      max: userCache.max,
      hits: userCache.calculatedSize,
    }
  }
}