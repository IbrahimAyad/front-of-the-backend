import { logger } from '../../src/utils/logger';

export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Failing, reject all requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold: number;      // Number of failures before opening
  resetTimeout: number;          // Time in ms before trying half-open
  monitoringPeriod: number;      // Time window for counting failures
  halfOpenLimit: number;         // Number of requests to test in half-open
  name: string;                  // Circuit breaker name for logging
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rejectedRequests: number;
  state: CircuitState;
  lastStateChange: Date;
  consecutiveFailures: number;
  lastFailureTime?: Date;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: Date[] = [];
  private consecutiveFailures = 0;
  private lastStateChange = new Date();
  private halfOpenRequests = 0;
  private metrics: CircuitBreakerMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rejectedRequests: 0,
    state: CircuitState.CLOSED,
    lastStateChange: new Date(),
    consecutiveFailures: 0
  };

  constructor(private options: CircuitBreakerOptions) {
    logger.info(`Circuit breaker initialized: ${options.name}`, {
      failureThreshold: options.failureThreshold,
      resetTimeout: options.resetTimeout
    });
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++;

    // Check if we should reject immediately
    if (this.state === CircuitState.OPEN) {
      const shouldTryHalfOpen = Date.now() - this.lastStateChange.getTime() > this.options.resetTimeout;
      
      if (shouldTryHalfOpen) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        this.metrics.rejectedRequests++;
        throw new Error(`Circuit breaker is OPEN for ${this.options.name}`);
      }
    }

    // Check half-open limit
    if (this.state === CircuitState.HALF_OPEN && this.halfOpenRequests >= this.options.halfOpenLimit) {
      this.metrics.rejectedRequests++;
      throw new Error(`Circuit breaker half-open limit reached for ${this.options.name}`);
    }

    try {
      if (this.state === CircuitState.HALF_OPEN) {
        this.halfOpenRequests++;
      }

      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.metrics.successfulRequests++;
    this.consecutiveFailures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenRequests--;
      
      // If we've had enough successful requests in half-open, close the circuit
      if (this.halfOpenRequests === 0) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }

    // Clean old failures outside monitoring period
    this.cleanOldFailures();
  }

  private onFailure(error: Error): void {
    this.metrics.failedRequests++;
    this.consecutiveFailures++;
    this.failures.push(new Date());
    this.metrics.lastFailureTime = new Date();

    logger.error(`Circuit breaker ${this.options.name} recorded failure`, {
      error: error.message,
      consecutiveFailures: this.consecutiveFailures,
      state: this.state
    });

    // Clean old failures
    this.cleanOldFailures();

    // Check if we should open the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we've exceeded failure threshold
      if (this.failures.length >= this.options.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  private cleanOldFailures(): void {
    const cutoff = Date.now() - this.options.monitoringPeriod;
    this.failures = this.failures.filter(failure => failure.getTime() > cutoff);
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();
    this.metrics.state = newState;
    this.metrics.lastStateChange = this.lastStateChange;

    if (newState === CircuitState.HALF_OPEN) {
      this.halfOpenRequests = 0;
    }

    logger.info(`Circuit breaker ${this.options.name} state transition`, {
      from: oldState,
      to: newState,
      consecutiveFailures: this.consecutiveFailures
    });
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics(): CircuitBreakerMetrics {
    return {
      ...this.metrics,
      consecutiveFailures: this.consecutiveFailures
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = [];
    this.consecutiveFailures = 0;
    this.halfOpenRequests = 0;
    this.lastStateChange = new Date();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      state: CircuitState.CLOSED,
      lastStateChange: new Date(),
      consecutiveFailures: 0
    };

    logger.info(`Circuit breaker ${this.options.name} has been reset`);
  }
}

// Factory for creating circuit breakers with common configurations
export class CircuitBreakerFactory {
  static createDatabaseCircuitBreaker(name: string = 'database'): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 5,        // Open after 5 failures
      resetTimeout: 30000,        // Try again after 30 seconds
      monitoringPeriod: 60000,    // Count failures in 1-minute window
      halfOpenLimit: 3            // Allow 3 test requests in half-open
    });
  }

  static createAPICircuitBreaker(name: string): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 10,       // More tolerant for APIs
      resetTimeout: 60000,        // 1 minute
      monitoringPeriod: 300000,   // 5-minute window
      halfOpenLimit: 5
    });
  }
}