import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let isConnecting = false;

export async function getRedisClient(): Promise<RedisClientType | null> {
  // Return existing client if available
  if (redisClient?.isReady) {
    return redisClient;
  }

  // Prevent multiple connection attempts
  if (isConnecting) {
    return null;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    isConnecting = true;
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.error('Redis: Max reconnection attempts reached');
            return false;
          }
          return Math.min(retries * 200, 1000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });

    redisClient.on('reconnecting', () => {
      console.warn('Redis Client Reconnecting...');
    });

    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    
    console.log('✅ Redis connected successfully');
    return redisClient;
    
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    redisClient = null;
    return null;
  } finally {
    isConnecting = false;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      console.log('Redis disconnected');
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  }
}

// Singleton getter for edge runtime compatibility
export function getRedisClientSync(): RedisClientType | null {
  return redisClient;
}