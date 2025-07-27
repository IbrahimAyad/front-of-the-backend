import { PrismaClient, Prisma } from '@prisma/client'

/**
 * Operation types for database query routing
 */
export type OperationType = 'read' | 'write'

/**
 * Configuration for database connections
 */
interface DatabaseConfig {
  writeUrl: string
  readUrl?: string
  connectionPoolSize?: number
  readConnectionPoolSize?: number
  queryTimeout?: number
}

/**
 * Schema-aware Prisma client with read/write splitting
 */
class SchemaAwareClient {
  private writeClient: PrismaClient
  private readClient: PrismaClient
  private readonly config: DatabaseConfig
  private connectionHealth: { write: boolean; read: boolean } = { write: true, read: true }

  constructor(config: DatabaseConfig) {
    this.config = config

    // Initialize write client (primary database)
    this.writeClient = new PrismaClient({
      datasources: {
        db: {
          url: config.writeUrl
        }
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty'
    })

    // Initialize read client (read replica or same as write if no read URL)
    const readUrl = config.readUrl || config.writeUrl
    this.readClient = readUrl === config.writeUrl ? this.writeClient : new PrismaClient({
      datasources: {
        db: {
          url: readUrl
        }
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty'
    })

    // Set up connection health monitoring
    this.monitorConnections()
  }

  /**
   * Get the appropriate client based on operation type
   */
  getClient(operationType: OperationType = 'read'): PrismaClient {
    if (operationType === 'write' || !this.connectionHealth.read) {
      return this.writeClient
    }
    
    return this.readClient
  }

  /**
   * Execute a read operation
   */
  async executeRead<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    const client = this.getClient('read')
    
    try {
      const startTime = Date.now()
      const result = await operation(client)
      const duration = Date.now() - startTime
      
      // Log slow queries
      if (duration > 200) {
        console.warn(`🐌 [READ] Slow query detected: ${duration}ms`)
      }
      
      return result
    } catch (error) {
      // Fallback to write client if read fails
      if (client === this.readClient && this.connectionHealth.read) {
        console.warn('Read client failed, falling back to write client:', error)
        this.connectionHealth.read = false
        
        // Retry with write client
        return this.executeRead(operation)
      }
      
      throw error
    }
  }

  /**
   * Execute a write operation
   */
  async executeWrite<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    const client = this.getClient('write')
    
    try {
      const startTime = Date.now()
      const result = await operation(client)
      const duration = Date.now() - startTime
      
      // Log slow writes
      if (duration > 500) {
        console.warn(`🐌 [WRITE] Slow write operation: ${duration}ms`)
      }
      
      return result
    } catch (error) {
      console.error('Write operation failed:', error)
      throw error
    }
  }

  /**
   * Execute a transaction (always uses write client)
   */
  async executeTransaction<T>(
    operation: (client: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.writeClient.$transaction(operation)
  }

  /**
   * Check if an operation is a read operation based on method name
   */
  private isReadOperation(method: string): boolean {
    const readMethods = [
      'findFirst',
      'findMany',
      'findUnique',
      'count',
      'aggregate',
      'groupBy',
      'findFirstOrThrow',
      'findUniqueOrThrow'
    ]
    
    return readMethods.some(readMethod => method.includes(readMethod))
  }

  /**
   * Monitor database connection health
   */
  private async monitorConnections(): Promise<void> {
    const checkConnections = async () => {
      try {
        // Check write connection
        await this.writeClient.$queryRaw`SELECT 1`
        this.connectionHealth.write = true
      } catch (error) {
        console.error('Write database connection failed:', error)
        this.connectionHealth.write = false
      }

      try {
        // Check read connection (if different from write)
        if (this.readClient !== this.writeClient) {
          await this.readClient.$queryRaw`SELECT 1`
          this.connectionHealth.read = true
        }
      } catch (error) {
        console.error('Read database connection failed:', error)
        this.connectionHealth.read = false
      }
    }

    // Initial check
    await checkConnections()

    // Check every 30 seconds
    setInterval(checkConnections, 30000)
  }

  /**
   * Get connection health status
   */
  getHealthStatus() {
    return {
      write: this.connectionHealth.write,
      read: this.connectionHealth.read,
      readWriteSplitEnabled: this.readClient !== this.writeClient
    }
  }

  /**
   * Disconnect all clients
   */
  async disconnect(): Promise<void> {
    await Promise.all([
      this.writeClient.$disconnect(),
      this.readClient !== this.writeClient ? this.readClient.$disconnect() : Promise.resolve()
    ])
  }
}

// Global client instance
let schemaAwareClient: SchemaAwareClient | null = null

/**
 * Get or create the schema-aware client instance
 */
export function getSchemaAwareClient(): SchemaAwareClient {
  if (!schemaAwareClient) {
    const config: DatabaseConfig = {
      writeUrl: process.env.DATABASE_URL!,
      readUrl: process.env.DATABASE_READONLY_URL, // Optional read replica URL
      connectionPoolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
      readConnectionPoolSize: parseInt(process.env.DATABASE_READ_POOL_SIZE || '15'),
      queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000')
    }

    if (!config.writeUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    schemaAwareClient = new SchemaAwareClient(config)
  }

  return schemaAwareClient
}

/**
 * Helper function to execute read operations
 */
export async function executeRead<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
  const client = getSchemaAwareClient()
  return client.executeRead(operation)
}

/**
 * Helper function to execute write operations
 */
export async function executeWrite<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
  const client = getSchemaAwareClient()
  return client.executeWrite(operation)
}

/**
 * Helper function to execute transactions
 */
export async function executeTransaction<T>(
  operation: (client: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const client = getSchemaAwareClient()
  return client.executeTransaction(operation)
}

/**
 * Smart routing proxy for Prisma operations
 * Automatically routes reads to read client and writes to write client
 */
export function createSmartPrismaProxy(): PrismaClient {
  const client = getSchemaAwareClient()
  
  return new Proxy({} as PrismaClient, {
    get(target, prop: string) {
      // Handle model access (e.g., prisma.user, prisma.product)
      if (typeof prop === 'string' && prop !== 'constructor') {
        return new Proxy({}, {
          get(modelTarget, method: string) {
            // Determine if this is a read or write operation
            const isRead = client['isReadOperation'] ? client['isReadOperation'](method) : false
            const operationType: OperationType = isRead ? 'read' : 'write'
            
            const actualClient = client.getClient(operationType)
            
            // Get the model from the appropriate client
            const model = (actualClient as any)[prop]
            if (model && typeof model[method] === 'function') {
              return model[method].bind(model)
            }
            
            return undefined
          }
        })
      }
      
      // Handle direct client methods
      const writeClient = client.getClient('write')
      if (writeClient && typeof (writeClient as any)[prop] === 'function') {
        return (writeClient as any)[prop].bind(writeClient)
      }
      
      return undefined
    }
  })
}

export { SchemaAwareClient }
export type { DatabaseConfig }