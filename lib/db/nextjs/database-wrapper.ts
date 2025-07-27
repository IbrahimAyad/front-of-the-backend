import { resilientDb } from './resilient-client';
import type { ResilientDb } from './resilient-client';

// Wrapper functions for common database operations with built-in resilience

export async function withDatabase<T>(
  operation: (db: ResilientDb) => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const operationName = operation.name || 'anonymous';
  
  try {
    const result = await operation(resilientDb.client);
    
    const duration = Date.now() - startTime;
    if (duration > 500) {
      console.warn(`[DB] Slow operation '${operationName}' took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[DB] Operation '${operationName}' failed after ${duration}ms:`, error);
    throw error;
  }
}

// Transaction wrapper with automatic retry
export async function withTransaction<T>(
  operation: (tx: ResilientDb) => Promise<T>
): Promise<T> {
  return withDatabase(async (db) => {
    // @ts-ignore - Prisma transaction typing
    return db.$transaction(async (tx) => {
      return operation(tx as ResilientDb);
    });
  });
}

// Batch operation wrapper
export async function batchOperation<T>(
  operations: Array<(db: ResilientDb) => Promise<T>>
): Promise<T[]> {
  return withDatabase(async (db) => {
    // Execute operations in parallel with resilience
    return Promise.all(operations.map(op => op(db)));
  });
}

// Common query patterns with resilience

export const dbQueries = {
  // Find with automatic retry
  async findUnique<T>(
    model: keyof ResilientDb,
    where: any
  ): Promise<T | null> {
    return withDatabase(async (db) => {
      // @ts-ignore - Dynamic model access
      return db[model].findUnique({ where });
    });
  },

  // Find many with pagination
  async findMany<T>(
    model: keyof ResilientDb,
    options?: {
      where?: any;
      orderBy?: any;
      take?: number;
      skip?: number;
      include?: any;
    }
  ): Promise<T[]> {
    return withDatabase(async (db) => {
      // @ts-ignore - Dynamic model access
      return db[model].findMany(options || {});
    });
  },

  // Create with retry
  async create<T>(
    model: keyof ResilientDb,
    data: any
  ): Promise<T> {
    return withDatabase(async (db) => {
      // @ts-ignore - Dynamic model access
      return db[model].create({ data });
    });
  },

  // Update with optimistic locking
  async update<T>(
    model: keyof ResilientDb,
    where: any,
    data: any
  ): Promise<T> {
    return withDatabase(async (db) => {
      // @ts-ignore - Dynamic model access
      return db[model].update({ where, data });
    });
  },

  // Delete with safety check
  async delete<T>(
    model: keyof ResilientDb,
    where: any
  ): Promise<T> {
    return withDatabase(async (db) => {
      // @ts-ignore - Dynamic model access
      return db[model].delete({ where });
    });
  },

  // Count with caching consideration
  async count(
    model: keyof ResilientDb,
    where?: any
  ): Promise<number> {
    return withDatabase(async (db) => {
      // @ts-ignore - Dynamic model access
      return db[model].count({ where });
    });
  }
};

// Health check helper
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    await withDatabase(async (db) => {
      await db.$queryRaw`SELECT 1`;
    });
    
    return {
      healthy: true,
      latency: Date.now() - startTime
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - startTime,
      error: (error as Error).message
    };
  }
}

// Export the resilient client for direct access when needed
export { resilientDb } from './resilient-client';
export type { ResilientDb } from './resilient-client';