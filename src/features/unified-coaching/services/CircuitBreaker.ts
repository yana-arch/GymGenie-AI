/**
 * Circuit Breaker Service
 * Implements circuit breaker pattern for AI service resilience
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  expectedRecoveryTime?: number;
}

export interface CircuitBreakerStats {
  failures: number;
  successes: number;
  lastFailureTime?: number;
  state: CircuitState;
  nextAttemptTime?: number;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringPeriod: 300000
  };

  private stats: CircuitBreakerStats = {
    failures: 0,
    successes: 0,
    state: 'closed'
  };

  private failureHistory: number[] = [];

  /**
   * Configure circuit breaker settings
   */
  configure(config: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.shouldTrip()) {
      this.tripCircuit();
      throw new Error('Circuit breaker is open');
    }

    if (this.stats.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.stats.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.stats.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): CircuitBreakerStats {
    return { ...this.stats };
  }

  /**
   * Reset circuit breaker manually
   */
  reset(): void {
    this.stats = {
      failures: 0,
      successes: 0,
      state: 'closed'
    };
    this.failureHistory = [];
  }

  // Private methods

  private shouldTrip(): boolean {
    return this.stats.failures >= this.config.failureThreshold;
  }

  private tripCircuit(): void {
    this.stats.state = 'open';
    this.stats.lastFailureTime = Date.now();
    this.stats.nextAttemptTime = Date.now() + this.config.resetTimeout;
  }

  private shouldAttemptReset(): boolean {
    if (!this.stats.nextAttemptTime) return false;
    return Date.now() >= this.stats.nextAttemptTime;
  }

  private onSuccess(): void {
    this.stats.successes++;
    
    if (this.stats.state === 'half-open') {
      this.reset();
    }
    
    this.cleanupOldFailures();
  }

  private onFailure(): void {
    this.stats.failures++;
    const now = Date.now();
    this.failureHistory.push(now);
    
    this.cleanupOldFailures();
    
    if (this.shouldTrip()) {
      this.tripCircuit();
    }
  }

  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.failureHistory = this.failureHistory.filter(time => time > cutoff);
  }
}