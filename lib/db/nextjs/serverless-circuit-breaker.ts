import { kv } from '@vercel/kv';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  name: string;
}

export interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  lastFailureTime?: number;
  lastStateChange: number;
  successCount: number;
}

// Serverless-optimized circuit breaker using edge storage
export class ServerlessCircuitBreaker {
  private localState: CircuitBreakerState;
  private stateKey: string;
  
  constructor(private options: CircuitBreakerOptions) {
    this.stateKey = `circuit:${options.name}`;
    this.localState = {
      state: CircuitState.CLOSED,
      failures: 0,
      lastStateChange: Date.now(),
      successCount: 0
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const state = await this.getState();
    
    // Check if circuit should reject
    if (state.state === CircuitState.OPEN) {
      const shouldTryHalfOpen = Date.now() - state.lastStateChange > this.options.resetTimeout;
      
      if (shouldTryHalfOpen) {
        await this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.options.name}`);
      }
    }

    try {
      const result = await operation();
      await this.onSuccess();
      return result;
    } catch (error) {
      await this.onFailure(error as Error);
      throw error;
    }
  }

  private async getState(): Promise<CircuitBreakerState> {
    // Try to get state from KV store if available
    if (typeof kv !== 'undefined') {
      try {
        const kvState = await kv.get<CircuitBreakerState>(this.stateKey);
        if (kvState) {
          this.localState = kvState;
          return kvState;
        }
      } catch (error) {
        // Fall back to local state if KV fails
        console.warn('[CircuitBreaker] KV store unavailable, using local state');
      }
    }
    
    return this.localState;
  }

  private async setState(state: CircuitBreakerState): Promise<void> {
    this.localState = state;
    
    // Try to persist to KV store
    if (typeof kv !== 'undefined') {
      try {
        await kv.set(this.stateKey, state, {
          ex: 300 // Expire after 5 minutes
        });
      } catch (error) {
        // Continue with local state only
        console.warn('[CircuitBreaker] Failed to persist state to KV');
      }
    }
  }

  private async onSuccess(): Promise<void> {
    const state = await this.getState();
    
    if (state.state === CircuitState.HALF_OPEN) {
      state.successCount++;
      
      // Close circuit after 3 successful requests
      if (state.successCount >= 3) {
        await this.transitionTo(CircuitState.CLOSED);
        return;
      }
    } else if (state.state === CircuitState.CLOSED) {
      // Reset failure count on success
      state.failures = 0;
    }
    
    await this.setState(state);
  }

  private async onFailure(error: Error): Promise<void> {
    const state = await this.getState();
    
    state.failures++;
    state.lastFailureTime = Date.now();
    
    console.error(`[CircuitBreaker] ${this.options.name} failure:`, {
      error: error.message,
      failures: state.failures,
      state: state.state
    });

    if (state.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open opens the circuit
      await this.transitionTo(CircuitState.OPEN);
    } else if (state.state === CircuitState.CLOSED) {
      // Check if we should open
      if (state.failures >= this.options.failureThreshold) {
        await this.transitionTo(CircuitState.OPEN);
      } else {
        await this.setState(state);
      }
    }
  }

  private async transitionTo(newState: CircuitState): Promise<void> {
    const state = await this.getState();
    const oldState = state.state;
    
    state.state = newState;
    state.lastStateChange = Date.now();
    
    if (newState === CircuitState.CLOSED) {
      state.failures = 0;
      state.successCount = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      state.successCount = 0;
    }
    
    await this.setState(state);
    
    console.log(`[CircuitBreaker] ${this.options.name} state transition:`, {
      from: oldState,
      to: newState
    });
  }

  async getMetrics() {
    const state = await this.getState();
    return {
      state: state.state,
      failures: state.failures,
      lastFailureTime: state.lastFailureTime,
      lastStateChange: state.lastStateChange,
      timeSinceLastFailure: state.lastFailureTime 
        ? Date.now() - state.lastFailureTime 
        : null
    };
  }

  async reset(): Promise<void> {
    await this.setState({
      state: CircuitState.CLOSED,
      failures: 0,
      lastStateChange: Date.now(),
      successCount: 0
    });
  }
}

// In-memory fallback for local development
class InMemoryCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime?: Date;
  private lastStateChange = new Date();
  private successCount = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should reject
    if (this.state === CircuitState.OPEN) {
      const shouldTryHalfOpen = Date.now() - this.lastStateChange.getTime() > this.options.resetTimeout;
      
      if (shouldTryHalfOpen) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.options.name}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failures = 0;
    }
  }

  private onFailure(error: Error): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED && this.failures >= this.options.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private transitionTo(newState: CircuitState): void {
    this.state = newState;
    this.lastStateChange = new Date();
    
    if (newState === CircuitState.CLOSED) {
      this.failures = 0;
      this.successCount = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
    }
  }

  async getMetrics() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime?.getTime(),
      lastStateChange: this.lastStateChange.getTime()
    };
  }

  async reset(): Promise<void> {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successCount = 0;
    this.lastStateChange = new Date();
  }
}

// Factory function that returns appropriate implementation
export function createCircuitBreaker(options: CircuitBreakerOptions) {
  // Use ServerlessCircuitBreaker in production with KV available
  if (process.env.NODE_ENV === 'production' && typeof kv !== 'undefined') {
    return new ServerlessCircuitBreaker(options);
  }
  
  // Use in-memory for development
  return new InMemoryCircuitBreaker(options);
}