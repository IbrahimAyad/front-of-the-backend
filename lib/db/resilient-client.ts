import { PrismaClient } from '@prisma/client';
import { CircuitBreaker, CircuitBreakerFactory } from './circuit-breaker';
import { ConnectionRetry, databaseRetry, RetryStrategies } from './connection-retry';
import { ConnectionMonitor, createConnectionMonitoringMiddleware } from './connection-monitor';
import { logger } from '../../src/utils/logger';

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
  private connectionMonitor: ConnectionMonitor;
  private isConnected = false;

  constructor(private options: ResilientClientOptions = {}) {
    // Set defaults
    this.options = {
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
      connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
      statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '30000'),
      idleInTransactionTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
      enableCircuitBreaker: true,
      enableRetry: true,
      enableMonitoring: true,
      logSlowQueries: true,
      slowQueryThreshold: 1000,
      ...options
    };

    // Initialize Prisma with optimized settings
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.buildConnectionUrl()
        }
      },
      log: this.options.logSlowQueries ? [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' }
      ] : ['error', 'warn']
    });

    // Initialize circuit breaker
    this.circuitBreaker = CircuitBreakerFactory.createDatabaseCircuitBreaker('main-db');

    // Initialize retry logic
    this.connectionRetry = databaseRetry;

    // Initialize monitoring
    this.connectionMonitor = new ConnectionMonitor(this.prisma, this.options.maxConnections);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Apply middleware
    if (this.options.enableMonitoring) {
      this.prisma.$use(createConnectionMonitoringMiddleware(this.connectionMonitor));
    }

    logger.info('Resilient Prisma client initialized', {
      maxConnections: this.options.maxConnections,
      enableCircuitBreaker: this.options.enableCircuitBreaker,
      enableRetry: this.options.enableRetry,
      enableMonitoring: this.options.enableMonitoring
    });
  }

  private buildConnectionUrl(): string {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Parse and add connection pool settings
    const url = new URL(baseUrl);
    
    // Connection pool settings
    url.searchParams.set('connection_limit', String(this.options.maxConnections));
    url.searchParams.set('connect_timeout', String(Math.floor(this.options.connectionTimeout! / 1000)));
    url.searchParams.set('pool_timeout', String(Math.floor(this.options.connectionTimeout! / 1000)));
    
    // Statement timeout
    url.searchParams.set('statement_timeout', String(this.options.statementTimeout));
    url.searchParams.set('idle_in_transaction_session_timeout', String(this.options.idleInTransactionTimeout));
    
    // Additional optimizations
    url.searchParams.set('pgbouncer', 'true'); // PgBouncer compatibility
    url.searchParams.set('schema', 'public');
    url.searchParams.set('sslmode', process.env.NODE_ENV === 'production' ? 'require' : 'prefer');

    return url.toString();
  }

  private setupEventListeners(): void {
    // Monitor connection events
    this.connectionMonitor.on('highUtilization', (data) => {
      logger.warn('High connection pool utilization', data);
    });

    this.connectionMonitor.on('connectionStorm', (event) => {
      logger.error('Connection storm detected', event.details);
    });

    this.connectionMonitor.on('unhealthy', (data) => {
      logger.error('Database connection unhealthy', data);
    });

    this.connectionMonitor.on('slowQuery', (query) => {
      logger.warn('Slow query detected', {
        duration: query.duration,
        query: query.query
      });
    });

    // Prisma event handlers
    if (this.options.logSlowQueries) {
      (this.prisma as any).$on('query', (e: any) => {
        if (e.duration > this.options.slowQueryThreshold!) {
          logger.warn('Slow database query', {
            query: e.query,
            duration: e.duration,
            params: e.params
          });
        }
      });
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.executeWithResilience(async () => {
        await this.prisma.$connect();
        this.isConnected = true;
        logger.info('Database connected successfully');
      });
    } catch (error) {
      logger.error('Failed to connect to database', { error: (error as Error).message });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      this.connectionMonitor.stop();
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database', { error: (error as Error).message });
      throw error;
    }
  }

  private async executeWithResilience<T>(operation: () => Promise<T>): Promise<T> {
    // Apply circuit breaker if enabled
    if (this.options.enableCircuitBreaker) {
      return this.circuitBreaker.execute(async () => {
        // Apply retry logic if enabled
        if (this.options.enableRetry) {
          return this.connectionRetry.execute(operation);
        }
        return operation();
      });
    }

    // Just retry logic if circuit breaker disabled
    if (this.options.enableRetry) {
      return this.connectionRetry.execute(operation);
    }

    // No resilience patterns
    return operation();
  }

  // Proxy all Prisma client methods with resilience
  get client(): PrismaClient {
    const handler = {
      get: (target: any, prop: string) => {
        const original = target[prop];
        
        // Don't wrap internal properties or methods
        if (prop.startsWith('_') || prop.startsWith('$') || typeof original !== 'function') {
          return original;
        }

        // Wrap database operations with resilience
        return new Proxy(original, {
          get: (innerTarget: any, innerProp: string) => {
            const innerOriginal = innerTarget[innerProp];
            
            if (typeof innerOriginal !== 'function') {
              return innerOriginal;
            }

            return async (...args: any[]) => {
              return this.executeWithResilience(() => innerOriginal.apply(innerTarget, args));
            };
          }
        });
      }
    };

    return new Proxy(this.prisma, handler);
  }

  // Health check with connection test
  async healthCheck(): Promise<{
    healthy: boolean;
    connectionPool: any;
    circuitBreaker: any;
    retry: any;
  }> {
    try {
      // Test connection
      await this.executeWithResilience(async () => {
        await this.prisma.$queryRaw`SELECT 1`;
      });

      return {
        healthy: true,
        connectionPool: this.connectionMonitor.getMetrics(),
        circuitBreaker: this.circuitBreaker.getMetrics(),
        retry: this.connectionRetry.getMetrics()
      };
    } catch (error) {
      logger.error('Health check failed', { error: (error as Error).message });
      
      return {
        healthy: false,
        connectionPool: this.connectionMonitor.getMetrics(),
        circuitBreaker: this.circuitBreaker.getMetrics(),
        retry: this.connectionRetry.getMetrics()
      };
    }
  }

  // Get monitoring data
  getMetrics() {
    return {
      connection: this.connectionMonitor.getMetrics(),
      circuitBreaker: this.circuitBreaker.getMetrics(),
      retry: this.connectionRetry.getMetrics(),
      events: this.connectionMonitor.getEvents(50),
      problematicQueries: this.connectionMonitor.getProblematicQueries(10)
    };
  }

  // Generate detailed report
  generateReport(): string {
    return `
Resilient Database Client Report
========================================
${this.connectionMonitor.generateReport()}

Circuit Breaker Status:
- State: ${this.circuitBreaker.getState()}
- Metrics: ${JSON.stringify(this.circuitBreaker.getMetrics(), null, 2)}

Retry Statistics:
- Metrics: ${JSON.stringify(this.connectionRetry.getMetrics(), null, 2)}
`;
  }
}

// Factory function for creating resilient client
export function createResilientPrismaClient(options?: ResilientClientOptions): ResilientPrismaClient {
  return new ResilientPrismaClient(options);
}

// Global instance (singleton)
let globalResilientClient: ResilientPrismaClient | null = null;

export function getResilientPrismaClient(options?: ResilientClientOptions): ResilientPrismaClient {
  if (!globalResilientClient) {
    globalResilientClient = createResilientPrismaClient(options);
  }
  return globalResilientClient;
}