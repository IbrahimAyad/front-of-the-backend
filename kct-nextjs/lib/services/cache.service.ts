/**
 * Cache Service for Redis-like operations
 * Implements LRU cache with TTL support for development
 * Can be extended to use Redis in production
 */

interface CacheItem {
  value: string
  expiry: number
}

export class CacheService {
  private cache = new Map<string, CacheItem>()
  private readonly DEFAULT_TTL = 300 // 5 minutes in seconds
  private readonly MAX_CACHE_SIZE = 1000

  /**
   * Set a cache value with TTL
   */
  async set(key: string, value: string, ttl: number = this.DEFAULT_TTL): Promise<void> {
    // Clean up expired entries if cache is getting large
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      this.cleanup()
    }

    const expiry = Date.now() + (ttl * 1000)
    this.cache.set(key, { value, expiry })
  }

  /**
   * Get a cache value
   */
  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  /**
   * Delete a cache key
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key)
  }

  /**
   * Check if key exists and is not expired
   */
  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key)
    
    if (!item) {
      return false
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear()
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidate(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    return keysToDelete.length
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let validEntries = 0
    let expiredEntries = 0
    const now = Date.now()

    for (const item of this.cache.values()) {
      if (now > item.expiry) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0 // Would need to track hits/misses to calculate
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Get or set pattern - useful for caching expensive operations
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = await this.get(key)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const value = await factory()
    await this.set(key, JSON.stringify(value), ttl)
    return value
  }

  /**
   * Increment a numeric value in cache
   */
  async increment(key: string, amount: number = 1, ttl: number = this.DEFAULT_TTL): Promise<number> {
    const current = await this.get(key)
    const newValue = (current ? parseInt(current, 10) : 0) + amount
    await this.set(key, newValue.toString(), ttl)
    return newValue
  }

  /**
   * Set multiple keys at once
   */
  async setMultiple(items: Array<{ key: string; value: string; ttl?: number }>): Promise<void> {
    for (const item of items) {
      await this.set(item.key, item.value, item.ttl || this.DEFAULT_TTL)
    }
  }

  /**
   * Get multiple keys at once
   */
  async getMultiple(keys: string[]): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {}
    
    for (const key of keys) {
      result[key] = await this.get(key)
    }

    return result
  }
}