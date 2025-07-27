import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CacheService } from '../../lib/services/cache.service'
import { mockRedisClient, resetRedisMocks } from '../mocks/redis'

// Mock Redis client
vi.mock('redis', () => ({
  createClient: vi.fn(() => mockRedisClient),
}))

describe('CacheService', () => {
  let cacheService: CacheService

  beforeEach(async () => {
    resetRedisMocks()
    vi.clearAllMocks()
    cacheService = new CacheService()
    await cacheService.connect()
  })

  describe('connect', () => {
    it('should connect to Redis', async () => {
      expect(mockRedisClient.connect).toHaveBeenCalled()
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function))
    })
  })

  describe('get', () => {
    it('should get value from cache', async () => {
      const key = 'test-key'
      const value = { name: 'Test', count: 42 }
      mockRedisClient.get.mockResolvedValue(JSON.stringify(value))

      const result = await cacheService.get(key)

      expect(mockRedisClient.get).toHaveBeenCalledWith(key)
      expect(result).toEqual(value)
    })

    it('should return null for non-existent key', async () => {
      mockRedisClient.get.mockResolvedValue(null)

      const result = await cacheService.get('non-existent')

      expect(result).toBeNull()
    })

    it('should handle JSON parse errors gracefully', async () => {
      mockRedisClient.get.mockResolvedValue('invalid-json')

      const result = await cacheService.get('test-key')

      expect(result).toBeNull()
    })

    it('should handle Redis errors', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'))

      const result = await cacheService.get('test-key')

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should set value in cache with TTL', async () => {
      const key = 'test-key'
      const value = { name: 'Test', count: 42 }
      const ttl = 300

      await cacheService.set(key, value, ttl)

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        { EX: ttl }
      )
    })

    it('should set value without TTL', async () => {
      const key = 'test-key'
      const value = 'simple-string'

      await cacheService.set(key, value)

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        {}
      )
    })

    it('should handle set errors gracefully', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis error'))

      // Should not throw
      await expect(
        cacheService.set('test-key', 'value')
      ).resolves.toBeUndefined()
    })
  })

  describe('del', () => {
    it('should delete key from cache', async () => {
      const key = 'test-key'
      mockRedisClient.del.mockResolvedValue(1)

      await cacheService.del(key)

      expect(mockRedisClient.del).toHaveBeenCalledWith(key)
    })

    it('should handle delete errors gracefully', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'))

      // Should not throw
      await expect(cacheService.del('test-key')).resolves.toBeUndefined()
    })
  })

  describe('exists', () => {
    it('should check if key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1)

      const result = await cacheService.exists('test-key')

      expect(mockRedisClient.exists).toHaveBeenCalledWith('test-key')
      expect(result).toBe(true)
    })

    it('should return false for non-existent key', async () => {
      mockRedisClient.exists.mockResolvedValue(0)

      const result = await cacheService.exists('non-existent')

      expect(result).toBe(false)
    })

    it('should handle exists errors', async () => {
      mockRedisClient.exists.mockRejectedValue(new Error('Redis error'))

      const result = await cacheService.exists('test-key')

      expect(result).toBe(false)
    })
  })

  describe('expire', () => {
    it('should set expiration on key', async () => {
      const key = 'test-key'
      const seconds = 300
      mockRedisClient.expire.mockResolvedValue(1)

      const result = await cacheService.expire(key, seconds)

      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, seconds)
      expect(result).toBe(true)
    })

    it('should return false if key does not exist', async () => {
      mockRedisClient.expire.mockResolvedValue(0)

      const result = await cacheService.expire('non-existent', 300)

      expect(result).toBe(false)
    })

    it('should handle expire errors', async () => {
      mockRedisClient.expire.mockRejectedValue(new Error('Redis error'))

      const result = await cacheService.expire('test-key', 300)

      expect(result).toBe(false)
    })
  })

  describe('ttl', () => {
    it('should get TTL of key', async () => {
      mockRedisClient.ttl.mockResolvedValue(300)

      const result = await cacheService.ttl('test-key')

      expect(mockRedisClient.ttl).toHaveBeenCalledWith('test-key')
      expect(result).toBe(300)
    })

    it('should return -2 for non-existent key', async () => {
      mockRedisClient.ttl.mockResolvedValue(-2)

      const result = await cacheService.ttl('non-existent')

      expect(result).toBe(-2)
    })

    it('should return -1 for key without expiration', async () => {
      mockRedisClient.ttl.mockResolvedValue(-1)

      const result = await cacheService.ttl('permanent-key')

      expect(result).toBe(-1)
    })

    it('should handle ttl errors', async () => {
      mockRedisClient.ttl.mockRejectedValue(new Error('Redis error'))

      const result = await cacheService.ttl('test-key')

      expect(result).toBe(-2)
    })
  })

  describe('mget', () => {
    it('should get multiple values', async () => {
      const keys = ['key1', 'key2', 'key3']
      const values = [
        JSON.stringify({ id: 1 }),
        null,
        JSON.stringify({ id: 3 }),
      ]
      mockRedisClient.mget.mockResolvedValue(values)

      const result = await cacheService.mget(keys)

      expect(mockRedisClient.mget).toHaveBeenCalledWith(keys)
      expect(result).toEqual([{ id: 1 }, null, { id: 3 }])
    })

    it('should handle mget errors', async () => {
      mockRedisClient.mget.mockRejectedValue(new Error('Redis error'))

      const result = await cacheService.mget(['key1', 'key2'])

      expect(result).toEqual([])
    })
  })

  describe('mset', () => {
    it('should set multiple key-value pairs', async () => {
      const keyValuePairs = {
        key1: { id: 1 },
        key2: 'value2',
        key3: [1, 2, 3],
      }

      await cacheService.mset(keyValuePairs)

      expect(mockRedisClient.mset).toHaveBeenCalledWith([
        'key1', JSON.stringify({ id: 1 }),
        'key2', JSON.stringify('value2'),
        'key3', JSON.stringify([1, 2, 3]),
      ])
    })

    it('should handle mset errors gracefully', async () => {
      mockRedisClient.mset.mockRejectedValue(new Error('Redis error'))

      // Should not throw
      await expect(
        cacheService.mset({ key1: 'value1' })
      ).resolves.toBeUndefined()
    })
  })

  describe('clearPattern', () => {
    it('should clear keys matching pattern', async () => {
      const pattern = 'products:*'
      const matchingKeys = ['products:1', 'products:2', 'products:all']
      mockRedisClient.keys.mockResolvedValue(matchingKeys)
      mockRedisClient.del.mockResolvedValue(matchingKeys.length)

      await cacheService.clearPattern(pattern)

      expect(mockRedisClient.keys).toHaveBeenCalledWith(pattern)
      expect(mockRedisClient.del).toHaveBeenCalledWith(matchingKeys)
    })

    it('should handle no matching keys', async () => {
      mockRedisClient.keys.mockResolvedValue([])

      await cacheService.clearPattern('non-existent:*')

      expect(mockRedisClient.del).not.toHaveBeenCalled()
    })

    it('should handle clearPattern errors gracefully', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'))

      // Should not throw
      await expect(
        cacheService.clearPattern('test:*')
      ).resolves.toBeUndefined()
    })
  })

  describe('flush', () => {
    it('should flush all keys', async () => {
      mockRedisClient.flushdb.mockResolvedValue('OK')

      await cacheService.flush()

      expect(mockRedisClient.flushdb).toHaveBeenCalled()
    })

    it('should handle flush errors gracefully', async () => {
      mockRedisClient.flushdb.mockRejectedValue(new Error('Redis error'))

      // Should not throw
      await expect(cacheService.flush()).resolves.toBeUndefined()
    })
  })

  describe('disconnect', () => {
    it('should disconnect from Redis', async () => {
      mockRedisClient.quit.mockResolvedValue('OK')

      await cacheService.disconnect()

      expect(mockRedisClient.quit).toHaveBeenCalled()
    })

    it('should handle disconnect errors gracefully', async () => {
      mockRedisClient.quit.mockRejectedValue(new Error('Redis error'))

      // Should not throw
      await expect(cacheService.disconnect()).resolves.toBeUndefined()
    })
  })
})