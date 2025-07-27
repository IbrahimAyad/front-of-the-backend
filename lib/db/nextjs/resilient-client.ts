import { PrismaClient } from '@prisma/client';
import { CircuitBreaker, CircuitBreakerFactory } from '../circuit-breaker';
import { ConnectionRetry, databaseRetry } from '../connection-retry';
import { ConnectionMonitor } from './connection-monitor';

// Singleton instance for Next.js
let globalResilientClient: ResilientPrismaClient | undefined;

// Development: prevent multiple instances during hot reloading
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  if (!global._resilientPrismaClient) {
    // @ts-ignore
    global._resilientPrismaClient = undefined;
  }
  // @ts-ignore
  globalResilientClient = global._resilientPrismaClient;
}

export interface ResilientClientOptions {
  maxConnections?: number;
  connectionTimeout?: number;
  statementTimeout?: number;
  idleInTransactionTimeout?: number;
  enableCircuitBreaker?: boolean;
  enableRetry?: boolean;
  enableMonitoring?: boolean;
  logSlowQueries?: boolean;
  slowQueryThreshold?: number;
}

export class ResilientPrismaClient {
  private prisma: PrismaClient;
  private circuitBreaker: CircuitBreaker;
  private connectionRetry: ConnectionRetry;
  private connectionMonitor: ConnectionMonitor | null = null;
  private isConnected = false;

  constructor(private options: ResilientClientOptions = {}) {
    // Set defaults optimized for serverless
    this.options = {
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '5'), // Lower for serverless
      connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'), // Faster timeout
      statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '10000'),
      idleInTransactionTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '10000'),
      enableCircuitBreaker: true,
      enableRetry: true,
      enableMonitoring: process.env.NODE_ENV === 'production',
      logSlowQueries: true,
      slowQueryThreshold: 500, // Lower threshold for serverless
      ...options
    };

    // Initialize Prisma with serverless-optimized settings
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.buildConnectionUrl()
        }
      },
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error']
    });

    // Initialize circuit breaker with serverless settings
    this.circuitBreaker = new CircuitBreaker({
      name: 'nextjs-db',
      failureThreshold: 3, // Lower threshold for faster failure
      resetTimeout: 20000, // 20 seconds
      monitoringPeriod: 60000,
      halfOpenLimit: 2
    });

    // Initialize retry logic
    this.connectionRetry = new ConnectionRetry({
      maxRetries: 2, // Fewer retries for serverless
      initialDelay: 500,
      maxDelay: 5000,
      factor: 2,
      jitter: true,
      retryableErrors: databaseRetry.defaultOptions.retryableErrors
    });

    // Initialize monitoring only in production
    if (this.options.enableMonitoring && typeof window === 'undefined') {
      this.connectionMonitor = new ConnectionMonitor(
        this.prisma,
        this.options.maxConnections!
      );
    }

    // Setup event listeners
    this.setupEventListeners();
  }

  private buildConnectionUrl(): string {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const url = new URL(baseUrl);
    
    // Serverless-optimized connection settings
    url.searchParams.set('connection_limit', String(this.options.maxConnections));
    url.searchParams.set('connect_timeout', String(Math.floor(this.options.connectionTimeout! / 1000)));
    url.searchParams.set('pool_timeout', String(Math.floor(this.options.connectionTimeout! / 1000)));
    url.searchParams.set('statement_timeout', String(this.options.statementTimeout));
    url.searchParams.set('idle_in_transaction_session_timeout', String(this.options.idleInTransactionTimeout));
    
    // Serverless-specific optimizations
    url.searchParams.set('pgbouncer', 'true');
    url.searchParams.set('connection_string_cache_size', '0'); // Disable for serverless
    url.searchParams.set('prepare_threshold', '0'); // Disable prepared statements
    
    return url.toString();
  }

  private setupEventListeners(): void {
    if (!this.connectionMonitor) return;

    // Simplified event handling for serverless
    this.connectionMonitor.on('unhealthy', (data) => {
      console.error('[ResilientClient] Database unhealthy:', data);
    });

    this.connectionMonitor.on('slowQuery', (query) => {
      console.warn('[ResilientClient] Slow query:', {
        duration: query.duration,
        query: query.query.substring(0, 100)
      });
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.executeWithResilience(async () => {
        await this.prisma.$connect();
        this.isConnected = true;
      });
    } catch (error) {
      console.error('[ResilientClient] Connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      this.connectionMonitor?.stop();
      await this.prisma.$disconnect();
      this.isConnected = false;
    } catch (error) {
      console.error('[ResilientClient] Disconnect error:', error);
    }
  }

  private async executeWithResilience<T>(operation: () => Promise<T>): Promise<T> {
    if (this.options.enableCircuitBreaker) {
      return this.circuitBreaker.execute(async () => {
        if (this.options.enableRetry) {
          return this.connectionRetry.execute(operation);
        }
        return operation();
      });
    }

    if (this.options.enableRetry) {
      return this.connectionRetry.execute(operation);
    }

    return operation();
  }

  // Proxy all Prisma client methods with resilience
  get client(): PrismaClient {
    const handler: ProxyHandler<any> = {
      get: (target: any, prop: string) => {
        const original = target[prop];
        
        // Don't wrap internal methods
        if (
          prop.startsWith('_') || 
          prop === '$connect' || 
          prop === '$disconnect' ||
          prop === '$on' ||
          prop === '$use' ||
          prop === '$extends' ||
          typeof original !== 'object'
        ) {
          return original;
        }

        // Wrap model operations
        return new Proxy(original, {
          get: (modelTarget: any, modelProp: string) => {
            const modelMethod = modelTarget[modelProp];
            
            if (typeof modelMethod !== 'function') {
              return modelMethod;
            }

            return async (...args: any[]) => {
              const startTime = Date.now();
              
              try {
                const result = await this.executeWithResilience(() => 
                  modelMethod.apply(modelTarget, args)
                );
                
                // Track successful query
                if (this.connectionMonitor) {
                  const duration = Date.now() - startTime;
                  this.connectionMonitor.trackQuery(
                    `${prop}.${modelProp}`,
                    duration
                  );
                }
                
                return result;
              } catch (error) {
                // Track failed query
                if (this.connectionMonitor) {
                  const duration = Date.now() - startTime;
                  this.connectionMonitor.trackQuery(
                    `${prop}.${modelProp}`,
                    duration,
                    error as Error
                  );
                  this.connectionMonitor.trackConnectionError(error as Error);
                }
                throw error;
              }
            };
          }
        });
      }
    };

    return new Proxy(this.prisma, handler);
  }

  // Serverless-optimized health check
  async healthCheck(): Promise<{
    healthy: boolean;
    latency?: number;
    circuitBreaker?: any;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      await this.executeWithResilience(async () => {
        await this.prisma.$queryRaw`SELECT 1`;
      });

      return {
        healthy: true,
        latency: Date.now() - startTime,
        circuitBreaker: this.circuitBreaker.getMetrics()
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        circuitBreaker: this.circuitBreaker.getMetrics(),
        error: (error as Error).message
      };
    }
  }

  getMetrics() {
    return {
      circuitBreaker: this.circuitBreaker.getMetrics(),
      retry: this.connectionRetry.getMetrics(),
      connection: this.connectionMonitor?.getMetrics()
    };
  }
}

// Serverless-safe singleton getter
export function getResilientPrismaClient(options?: ResilientClientOptions): ResilientPrismaClient {
  if (!globalResilientClient) {
    globalResilientClient = new ResilientPrismaClient(options);
    
    // In development, store in global to survive hot reloading
    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore
      global._resilientPrismaClient = globalResilientClient;
    }
  }
  
  return globalResilientClient;
}

// Export a pre-configured instance
export const resilientDb = getResilientPrismaClient();

// Type helper for better IDE support
export type ResilientDb = ReturnType<typeof getResilientPrismaClient>['client'];