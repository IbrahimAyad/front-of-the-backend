import { logger } from '../../src/utils/logger';

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
  jitter: boolean;
  retryableErrors?: string[];
  onRetry?: (error: Error, attempt: number) => void;
}

export interface RetryMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageRetryCount: number;
  maxRetryCount: number;
  retryReasons: Map<string, number>;
}

// PostgreSQL error codes that are retryable
export const RETRYABLE_POSTGRES_ERRORS = [
  '08000', // connection_exception
  '08003', // connection_does_not_exist
  '08006', // connection_failure
  '08001', // sqlclient_unable_to_establish_sqlconnection
  '08004', // sqlserver_rejected_establishment_of_sqlconnection
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now
  '58000', // system_error
  '58030', // io_error
  '40001', // serialization_failure
  '40P01', // deadlock_detected
  '55P03', // lock_not_available
  '53300', // too_many_connections
  '53400', // configuration_limit_exceeded
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'ENOTFOUND',
  'ENETUNREACH',
  'EAI_AGAIN'
];

export class ConnectionRetry {
  private metrics: RetryMetrics = {
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    averageRetryCount: 0,
    maxRetryCount: 0,
    retryReasons: new Map()
  };

  constructor(private defaultOptions: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    factor: 2,
    jitter: true,
    retryableErrors: RETRYABLE_POSTGRES_ERRORS
  }) {}

  async execute<T>(
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error | null = null;
    let attempt = 0;

    this.metrics.totalAttempts++;

    while (attempt <= opts.maxRetries) {
      try {
        const result = await operation();
        
        // Success
        this.metrics.successfulAttempts++;
        this.updateAverageRetryCount(attempt);
        
        if (attempt > 0) {
          logger.info('Operation succeeded after retry', {
            attempt,
            totalAttempts: attempt + 1
          });
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (!this.shouldRetry(lastError, attempt, opts)) {
          this.metrics.failedAttempts++;
          throw lastError;
        }

        const delay = this.calculateDelay(attempt, opts);
        
        logger.warn('Operation failed, retrying', {
          attempt: attempt + 1,
          maxRetries: opts.maxRetries,
          delay,
          error: lastError.message,
          errorCode: (lastError as any).code
        });

        // Track retry reason
        const reason = (lastError as any).code || lastError.message;
        this.metrics.retryReasons.set(
          reason,
          (this.metrics.retryReasons.get(reason) || 0) + 1
        );

        if (opts.onRetry) {
          opts.onRetry(lastError, attempt + 1);
        }

        await this.delay(delay);
        attempt++;
      }
    }

    this.metrics.failedAttempts++;
    throw lastError || new Error('Operation failed after retries');
  }

  private shouldRetry(error: Error, attempt: number, options: RetryOptions): boolean {
    if (attempt >= options.maxRetries) {
      return false;
    }

    const errorCode = (error as any).code;
    const errorMessage = error.message;

    // Check if error is retryable
    if (options.retryableErrors) {
      const isRetryable = options.retryableErrors.some(retryableError => {
        if (errorCode && errorCode === retryableError) {
          return true;
        }
        if (errorMessage && errorMessage.includes(retryableError)) {
          return true;
        }
        return false;
      });

      if (!isRetryable) {
        logger.warn('Error is not retryable', {
          errorCode,
          errorMessage: errorMessage.substring(0, 200)
        });
        return false;
      }
    }

    return true;
  }

  private calculateDelay(attempt: number, options: RetryOptions): number {
    let delay = Math.min(
      options.initialDelay * Math.pow(options.factor, attempt),
      options.maxDelay
    );

    if (options.jitter) {
      // Add random jitter (±25%)
      const jitter = delay * 0.25;
      delay = delay + (Math.random() * 2 - 1) * jitter;
    }

    return Math.round(delay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateAverageRetryCount(retries: number): void {
    if (retries > this.metrics.maxRetryCount) {
      this.metrics.maxRetryCount = retries;
    }

    const totalRetries = this.metrics.averageRetryCount * (this.metrics.successfulAttempts - 1) + retries;
    this.metrics.averageRetryCount = totalRetries / this.metrics.successfulAttempts;
  }

  getMetrics(): RetryMetrics {
    return {
      ...this.metrics,
      retryReasons: new Map(this.metrics.retryReasons)
    };
  }

  resetMetrics(): void {
    this.metrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      averageRetryCount: 0,
      maxRetryCount: 0,
      retryReasons: new Map()
    };
  }
}

// Specific retry strategies for different scenarios
export class RetryStrategies {
  static readonly CONNECTION_RESET: Partial<RetryOptions> = {
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 10000,
    factor: 1.5,
    jitter: true,
    retryableErrors: ['ECONNRESET', 'EPIPE', 'ECONNREFUSED']
  };

  static readonly POOL_EXHAUSTED: Partial<RetryOptions> = {
    maxRetries: 10,
    initialDelay: 2000,
    maxDelay: 60000,
    factor: 2,
    jitter: true,
    retryableErrors: ['53300', 'too_many_connections', 'FATAL:  remaining connection slots are reserved']
  };

  static readonly LOCK_TIMEOUT: Partial<RetryOptions> = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    factor: 2,
    jitter: false,
    retryableErrors: ['55P03', 'lock_not_available', '40P01', 'deadlock_detected']
  };

  static readonly STATEMENT_TIMEOUT: Partial<RetryOptions> = {
    maxRetries: 1, // Usually don't retry timeouts
    initialDelay: 0,
    maxDelay: 0,
    factor: 1,
    jitter: false,
    retryableErrors: ['57014', 'statement_timeout']
  };
}

// Global retry instance for database operations
export const databaseRetry = new ConnectionRetry({
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  jitter: true,
  retryableErrors: RETRYABLE_POSTGRES_ERRORS,
  onRetry: (error, attempt) => {
    logger.warn('Database operation retry', {
      attempt,
      error: error.message,
      code: (error as any).code,
      stack: error.stack
    });
  }
});