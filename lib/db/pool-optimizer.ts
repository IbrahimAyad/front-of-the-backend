import { logger } from '../../src/utils/logger';

export interface PoolConfiguration {
  // Connection pool size
  minConnections: number;
  maxConnections: number;
  
  // Timeouts (in milliseconds)
  connectionTimeout: number;
  idleTimeout: number;
  maxLifetime: number;
  statementTimeout: number;
  lockTimeout: number;
  
  // Connection behavior
  connectionRetryAttempts: number;
  connectionRetryDelay: number;
  keepAlive: boolean;
  keepAliveInterval: number;
  
  // Pool behavior
  queueTimeout: number;
  acquireTimeout: number;
  createTimeout: number;
  destroyTimeout: number;
  reapInterval: number;
  returnToHead: boolean;
  
  // Performance
  statementCacheSize: number;
  preparedStatements: boolean;
}

export class PoolOptimizer {
  static getOptimalConfiguration(
    environment: 'development' | 'staging' | 'production',
    expectedConcurrency: number = 100
  ): PoolConfiguration {
    const baseConfig: PoolConfiguration = {
      // Base values
      minConnections: 2,
      maxConnections: 20,
      connectionTimeout: 30000,
      idleTimeout: 30000,
      maxLifetime: 1800000, // 30 minutes
      statementTimeout: 30000,
      lockTimeout: 10000,
      connectionRetryAttempts: 3,
      connectionRetryDelay: 1000,
      keepAlive: true,
      keepAliveInterval: 30000,
      queueTimeout: 60000,
      acquireTimeout: 30000,
      createTimeout: 30000,
      destroyTimeout: 5000,
      reapInterval: 1000,
      returnToHead: false,
      statementCacheSize: 200,
      preparedStatements: true
    };

    // Adjust based on environment
    switch (environment) {
      case 'production':
        return this.optimizeForProduction(baseConfig, expectedConcurrency);
      case 'staging':
        return this.optimizeForStaging(baseConfig, expectedConcurrency);
      case 'development':
        return this.optimizeForDevelopment(baseConfig);
      default:
        return baseConfig;
    }
  }

  private static optimizeForProduction(
    config: PoolConfiguration,
    expectedConcurrency: number
  ): PoolConfiguration {
    // Calculate optimal pool size
    const cpuCount = parseInt(process.env.CPU_COUNT || '2');
    const optimalSize = Math.min(
      expectedConcurrency * 0.1, // 10% of expected concurrent users
      cpuCount * 4,              // 4 connections per CPU
      100                         // Hard limit
    );

    return {
      ...config,
      minConnections: Math.max(5, Math.floor(optimalSize * 0.25)),
      maxConnections: Math.max(20, optimalSize),
      
      // Aggressive timeouts for production
      connectionTimeout: 10000,    // 10 seconds
      idleTimeout: 600000,        // 10 minutes
      maxLifetime: 3600000,       // 1 hour
      statementTimeout: 30000,    // 30 seconds
      lockTimeout: 5000,          // 5 seconds
      
      // Faster retries
      connectionRetryAttempts: 5,
      connectionRetryDelay: 500,
      
      // Keep connections warm
      keepAlive: true,
      keepAliveInterval: 30000,
      
      // Pool tuning
      queueTimeout: 10000,        // 10 seconds max wait
      acquireTimeout: 5000,       // 5 seconds to acquire
      createTimeout: 5000,        // 5 seconds to create
      destroyTimeout: 1000,       // 1 second to destroy
      reapInterval: 500,          // Check every 500ms
      returnToHead: true,         // LIFO for better connection reuse
      
      // Performance
      statementCacheSize: 500,
      preparedStatements: true
    };
  }

  private static optimizeForStaging(
    config: PoolConfiguration,
    expectedConcurrency: number
  ): PoolConfiguration {
    const stagingSize = Math.min(expectedConcurrency * 0.2, 50);

    return {
      ...config,
      minConnections: Math.max(3, Math.floor(stagingSize * 0.3)),
      maxConnections: Math.max(15, stagingSize),
      
      // Moderate timeouts
      connectionTimeout: 20000,
      idleTimeout: 300000,       // 5 minutes
      maxLifetime: 1800000,      // 30 minutes
      statementTimeout: 45000,
      lockTimeout: 7500,
      
      // Standard retries
      connectionRetryAttempts: 4,
      connectionRetryDelay: 750,
      
      // Pool settings
      queueTimeout: 30000,
      acquireTimeout: 10000,
      createTimeout: 10000,
      destroyTimeout: 2000,
      reapInterval: 750,
      returnToHead: true,
      
      // Performance
      statementCacheSize: 300,
      preparedStatements: true
    };
  }

  private static optimizeForDevelopment(config: PoolConfiguration): PoolConfiguration {
    return {
      ...config,
      minConnections: 1,
      maxConnections: 5,
      
      // Relaxed timeouts for debugging
      connectionTimeout: 60000,
      idleTimeout: 120000,
      maxLifetime: 3600000,
      statementTimeout: 120000,
      lockTimeout: 30000,
      
      // Minimal retries
      connectionRetryAttempts: 2,
      connectionRetryDelay: 1000,
      
      // Development pool settings
      queueTimeout: 60000,
      acquireTimeout: 30000,
      createTimeout: 30000,
      destroyTimeout: 5000,
      reapInterval: 5000,
      returnToHead: false,
      
      // Performance
      statementCacheSize: 100,
      preparedStatements: false // Easier debugging
    };
  }

  static generatePrismaUrl(baseUrl: string, config: PoolConfiguration): string {
    const url = new URL(baseUrl);
    
    // Connection pool parameters
    url.searchParams.set('connection_limit', String(config.maxConnections));
    url.searchParams.set('pool_timeout', String(Math.floor(config.acquireTimeout / 1000)));
    url.searchParams.set('connect_timeout', String(Math.floor(config.connectionTimeout / 1000)));
    
    // PostgreSQL specific parameters
    url.searchParams.set('statement_timeout', String(config.statementTimeout));
    url.searchParams.set('lock_timeout', String(config.lockTimeout));
    url.searchParams.set('idle_in_transaction_session_timeout', String(config.idleTimeout));
    
    // Performance parameters
    if (config.preparedStatements) {
      url.searchParams.set('prepare_threshold', '1');
      url.searchParams.set('statement_cache_size', String(config.statementCacheSize));
    }
    
    return url.toString();
  }

  static generatePostgreSQLConfig(config: PoolConfiguration): Record<string, string> {
    return {
      // Connection settings
      'max_connections': String(config.maxConnections * 2), // Allow headroom
      'superuser_reserved_connections': '3',
      
      // Memory settings (assuming 1GB available)
      'shared_buffers': '256MB',
      'effective_cache_size': '768MB',
      'maintenance_work_mem': '64MB',
      'work_mem': '4MB',
      
      // Checkpoint settings
      'checkpoint_completion_target': '0.9',
      'wal_buffers': '16MB',
      'checkpoint_segments': '32',
      
      // Query planning
      'random_page_cost': '1.1', // For SSD
      'effective_io_concurrency': '200', // For SSD
      
      // Logging
      'log_min_duration_statement': '1000', // Log queries over 1 second
      'log_connections': 'on',
      'log_disconnections': 'on',
      'log_lock_waits': 'on',
      'log_temp_files': '0',
      
      // Statement behavior
      'statement_timeout': String(config.statementTimeout),
      'lock_timeout': String(config.lockTimeout),
      'idle_in_transaction_session_timeout': String(config.idleTimeout),
      
      // Connection behavior
      'tcp_keepalives_idle': '60',
      'tcp_keepalives_interval': '10',
      'tcp_keepalives_count': '6'
    };
  }

  static async testConfiguration(
    prismaClient: any,
    config: PoolConfiguration
  ): Promise<{ success: boolean; metrics: any }> {
    const startTime = Date.now();
    const results = {
      connectionTest: false,
      queryTest: false,
      concurrencyTest: false,
      avgConnectionTime: 0,
      avgQueryTime: 0,
      errors: [] as string[]
    };

    try {
      // Test basic connection
      const connStart = Date.now();
      await prismaClient.$connect();
      results.avgConnectionTime = Date.now() - connStart;
      results.connectionTest = true;

      // Test query execution
      const queryStart = Date.now();
      await prismaClient.$queryRaw`SELECT 1`;
      results.avgQueryTime = Date.now() - queryStart;
      results.queryTest = true;

      // Test concurrent connections
      const concurrentTests = Array(Math.min(config.maxConnections, 10))
        .fill(0)
        .map(async () => {
          const start = Date.now();
          await prismaClient.$queryRaw`SELECT pg_sleep(0.1)`;
          return Date.now() - start;
        });

      const times = await Promise.all(concurrentTests);
      const avgConcurrentTime = times.reduce((a, b) => a + b, 0) / times.length;
      results.concurrencyTest = avgConcurrentTime < 500; // Should be ~100ms + overhead

      logger.info('Pool configuration test completed', {
        duration: Date.now() - startTime,
        results
      });

      return {
        success: results.connectionTest && results.queryTest && results.concurrencyTest,
        metrics: results
      };
    } catch (error) {
      results.errors.push((error as Error).message);
      logger.error('Pool configuration test failed', { error, results });
      
      return {
        success: false,
        metrics: results
      };
    }
  }
}

// Environment-specific configurations
export const POOL_CONFIGS = {
  railway: PoolOptimizer.getOptimalConfiguration('production', 100),
  heroku: {
    ...PoolOptimizer.getOptimalConfiguration('production', 100),
    maxConnections: 18, // Heroku limit is 20, leave 2 for maintenance
  },
  aws_rds: {
    ...PoolOptimizer.getOptimalConfiguration('production', 200),
    maxConnections: 50, // RDS t3.micro limit
  },
  local: PoolOptimizer.getOptimalConfiguration('development', 10)
};

// Health check query for connection validation
export const HEALTH_CHECK_QUERY = `
  SELECT 
    current_database() as database,
    current_user as user,
    version() as version,
    pg_is_in_recovery() as is_replica,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
    (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections,
    pg_postmaster_start_time() as server_start_time
`;