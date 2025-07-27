import { vi } from 'vitest'

export const mockRedisClient = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  mget: vi.fn(),
  mset: vi.fn(),
  keys: vi.fn(),
  flushdb: vi.fn(),
  quit: vi.fn(),
  on: vi.fn(),
  connect: vi.fn().mockResolvedValue(undefined),
}

export const resetRedisMocks = () => {
  Object.values(mockRedisClient).forEach((method) => {
    if (typeof method === 'function' && 'mockClear' in method) {
      method.mockClear()
    }
  })
}