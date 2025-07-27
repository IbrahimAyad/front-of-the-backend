import Redis from 'ioredis';

export interface CacheServiceConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  enableOfflineQueue?: boolean;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  nx?: boolean; // Only set if not exists
  xx?: boolean; // Only set if exists
}

export class CacheService {
  private redis: Redis;
  private keyPrefix: string;
  private defaultTTL = 3600; // 1 hour

  constructor(config: CacheServiceConfig = {}) {
    this.keyPrefix = config.keyPrefix || 'kct:';
    
    this.redis = new Redis({
      host: config.host || 'localhost',
      port: config.port || 6379,
      password: config.password,
      db: config.db || 0,
      enableOfflineQueue: config.enableOfflineQueue !== false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  private prefixKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.redis.get(this.prefixKey(key));
      return value;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      const prefixedKey = this.prefixKey(key);
      const expiry = ttl || this.defaultTTL;
      
      await this.redis.set(prefixedKey, value, 'EX', expiry);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      throw error;
    }
  }

  async setWithOptions(key: string, value: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const prefixedKey = this.prefixKey(key);
      const args: any[] = [prefixedKey, value];
      
      if (options.ttl) {
        args.push('EX', options.ttl);
      }
      
      if (options.nx) {
        args.push('NX');
      } else if (options.xx) {
        args.push('XX');
      }
      
      const result = await this.redis.set(...args);
      return result === 'OK';
    } catch (error) {
      console.error(`Cache setWithOptions error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(this.prefixKey(key));
      return result === 1;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const prefixedPattern = this.prefixKey(pattern);
      const keys = await this.redis.keys(prefixedPattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache invalidate error for pattern ${pattern}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.prefixKey(key));
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async getTTL(key: string): Promise<number> {
    try {
      const ttl = await this.redis.ttl(this.prefixKey(key));
      return ttl;
    } catch (error) {
      console.error(`Cache getTTL error for key ${key}:`, error);
      return -1;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(this.prefixKey(key), ttl);
      return result === 1;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, by: number = 1): Promise<number> {
    try {
      const result = await this.redis.incrby(this.prefixKey(key), by);
      return result;
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      throw error;
    }
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    try {
      const result = await this.redis.decrby(this.prefixKey(key), by);
      return result;
    } catch (error) {
      console.error(`Cache decrement error for key ${key}:`, error);
      throw error;
    }
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      const prefixedKeys = keys.map(key => this.prefixKey(key));
      const values = await this.redis.mget(...prefixedKeys);
      return values;
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, string>, ttl?: number): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const prefixedKey = this.prefixKey(key);
        if (ttl) {
          pipeline.set(prefixedKey, value, 'EX', ttl);
        } else {
          pipeline.set(prefixedKey, value);
        }
      });
      
      await pipeline.exec();
    } catch (error) {
      console.error('Cache mset error:', error);
      throw error;
    }
  }

  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Cache flush error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  isConnected(): boolean {
    return this.redis.status === 'ready';
  }

  async getInfo(): Promise<{ usedMemory: number; keyCount: number }> {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      // Parse memory usage
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const usedMemory = memoryMatch ? parseInt(memoryMatch[1], 10) : 0;
      
      // Parse key count
      const dbMatch = keyspace.match(/db\d+:keys=(\d+)/);
      const keyCount = dbMatch ? parseInt(dbMatch[1], 10) : 0;
      
      return { usedMemory, keyCount };
    } catch (error) {
      console.error('Failed to get Redis info:', error);
      return { usedMemory: 0, keyCount: 0 };
    }
  }
}

export function createCacheService(config?: CacheServiceConfig): CacheService {
  return new CacheService(config);
}