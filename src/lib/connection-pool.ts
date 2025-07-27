import { Pool, PoolConfig } from 'pg'
import { PrismaClient } from '@prisma/client'

export interface DatabasePoolConfig {
  writer: PoolConfig
  reader: PoolConfig
}

// Optimized configuration for Railway PostgreSQL with PgBouncer
export const poolConfig: DatabasePoolConfig = {
  writer: {
    connectionString: process.env.DATABASE_URL,
    // Conservative pool size for Railway's PgBouncer limits
    max: process.env.NODE_ENV === 'production' ? 15 : 10,
    min: 1,
    // Aggressive idle timeout to free connections quickly for PgBouncer
    idleTimeoutMillis: 5000,
    // Quick connection timeout for Railway's network
    connectionTimeoutMillis: 2000,
    // Statement timeout to prevent long-running queries
    statement_timeout: 25000,
    // Application name for Railway monitoring
    application_name: `kct_fastify_writer_${process.env.RAILWAY_ENVIRONMENT || 'local'}`,
    // Keep alive optimized for Railway
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
    // Additional Railway optimizations
    query_timeout: 25000,
    idle_in_transaction_session_timeout: 10000,
  },
  reader: {
    connectionString: process.env.DATABASE_READONLY_URL || process.env.DATABASE_URL,
    // Larger pool for read operations but still Railway-friendly
    max: process.env.NODE_ENV === 'production' ? 25 : 15,
    min: 2,
    // Moderate idle timeout for read connections
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 2000,
    statement_timeout: 45000,
    application_name: `kct_fastify_reader_${process.env.RAILWAY_ENVIRONMENT || 'local'}`,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
    // Read-optimized settings
    query_timeout: 45000,
    idle_in_transaction_session_timeout: 20000,
  }
}

export class DatabasePool {
  private static instance: DatabasePool
  private writePool: Pool
  private readPool: Pool
  private prismaWrite: PrismaClient
  private prismaRead: PrismaClient
  private healthCheckInterval?: NodeJS.Timeout

  private constructor() {
    // Initialize write pool with error handling
    this.writePool = new Pool(poolConfig.writer)
    this.writePool.on('error', (err) => {
      console.error('Write pool error:', err)
    })
    this.writePool.on('connect', () => {
      console.log('New write connection established')
    })

    // Initialize read pool
    this.readPool = new Pool(poolConfig.reader)
    this.readPool.on('error', (err) => {
      console.error('Read pool error:', err)
    })

    // Initialize Prisma clients
    this.prismaWrite = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL }
      },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
    })

    this.prismaRead = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_READONLY_URL || process.env.DATABASE_URL }
      },
      log: ['error']
    })

    // Start health check
    this.startHealthCheck()
  }

  static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool()
    }
    return DatabasePool.instance
  }

  // Get appropriate pool based on operation type
  getPool(readonly: boolean = false): Pool {
    return readonly ? this.readPool : this.writePool
  }

  // Get appropriate Prisma client
  getPrisma(readonly: boolean = false): PrismaClient {
    return readonly ? this.prismaRead : this.prismaWrite
  }

  // Execute query with automatic retry and pool selection
  async query<T>(sql: string, params: any[] = [], readonly: boolean = true): Promise<T[]> {
    const pool = this.getPool(readonly)
    let retries = 3
    let lastError: Error

    while (retries > 0) {
      try {
        const client = await pool.connect()
        try {
          // Set statement timeout for this specific query
          await client.query('SET statement_timeout = 30000')
          const result = await client.query(sql, params)
          return result.rows as T[]
        } finally {
          client.release()
        }
      } catch (error: any) {
        lastError = error
        retries--
        
        // Handle specific PostgreSQL errors
        if (error.code === '53300') { // too_many_connections
          console.error('Too many connections, waiting before retry...')
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)))
        } else if (error.code === '57P01') { // admin_shutdown
          console.error('Database is shutting down')
          throw error
        } else if (error.code === '08P01') { // protocol_violation
          console.error('Protocol violation, likely connection issue')
          // Don't retry protocol violations
          throw error
        }
      }
    }

    throw lastError!
  }

  // Transaction wrapper with proper connection handling
  async transaction<T>(
    callback: (client: any) => Promise<T>,
    readonly: boolean = false
  ): Promise<T> {
    const pool = this.getPool(readonly)
    const client = await pool.connect()

    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  // Health check implementation
  private startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.checkHealth()
        if (!health.write.healthy || !health.read.healthy) {
          console.error('Database health check failed:', health)
        }
      } catch (error) {
        console.error('Health check error:', error)
      }
    }, 30000) // Check every 30 seconds
  }

  async checkHealth() {
    const results = {
      write: { healthy: false, latency: 0, connections: 0 },
      read: { healthy: false, latency: 0, connections: 0 }
    }

    // Check write pool
    try {
      const start = Date.now()
      await this.writePool.query('SELECT 1')
      results.write.healthy = true
      results.write.latency = Date.now() - start
      results.write.connections = this.writePool.totalCount
    } catch (error) {
      console.error('Write pool health check failed:', error)
    }

    // Check read pool
    try {
      const start = Date.now()
      await this.readPool.query('SELECT 1')
      results.read.healthy = true
      results.read.latency = Date.now() - start
      results.read.connections = this.readPool.totalCount
    } catch (error) {
      console.error('Read pool health check failed:', error)
    }

    return results
  }

  // Get pool statistics
  async getStats() {
    return {
      write: {
        total: this.writePool.totalCount,
        idle: this.writePool.idleCount,
        waiting: this.writePool.waitingCount
      },
      read: {
        total: this.readPool.totalCount,
        idle: this.readPool.idleCount,
        waiting: this.readPool.waitingCount
      }
    }
  }

  // Graceful shutdown
  async shutdown() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    await Promise.all([
      this.writePool.end(),
      this.readPool.end(),
      this.prismaWrite.$disconnect(),
      this.prismaRead.$disconnect()
    ])
  }
}

// Export singleton getter
export const getPool = () => DatabasePool.getInstance()