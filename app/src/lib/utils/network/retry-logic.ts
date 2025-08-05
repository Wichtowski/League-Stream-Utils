interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
}

class RetryLogic {
  private readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryCondition: this.defaultRetryCondition,
    onRetry: () => {},
  };

  private defaultRetryCondition(error: unknown): boolean {
    // Retry on network errors, 5xx server errors, and rate limiting
    if (error && typeof error === "object" && "name" in error) {
      if (error.name === "AbortError") return false; // Don't retry aborted requests
      if (
        error.name === "TypeError" &&
        "message" in error &&
        typeof error.message === "string" &&
        error.message.includes("fetch")
      )
        return true; // Network error
    }
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof error.status === "number"
    ) {
      if (error.status >= 500 && error.status < 600) return true; // Server error
      if (error.status === 429) return true; // Rate limiting
      if (error.status === 408) return true; // Request timeout
    }
    return false;
  }

  async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<RetryResult<T>> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    let lastError: unknown;
    let delay = config.baseDelay;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          attempts: attempt,
        };
      } catch (error) {
        lastError = error;

        // Check if we should retry
        if (attempt === config.maxAttempts || !config.retryCondition(error)) {
          return {
            success: false,
            error,
            attempts: attempt,
          };
        }

        // Call onRetry callback
        config.onRetry(attempt, error);

        // Wait before retrying (except on last attempt)
        if (attempt < config.maxAttempts) {
          await this.delay(delay);
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
        }
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: config.maxAttempts,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Specialized retry methods for common scenarios
  async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 5,
  ): Promise<RetryResult<T>> {
    return this.retry(operation, {
      maxAttempts,
      baseDelay: 500,
      backoffMultiplier: 2,
    });
  }

  async retryWithJitter<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
  ): Promise<RetryResult<T>> {
    return this.retry(operation, {
      maxAttempts,
      baseDelay: 1000,
      backoffMultiplier: 2,
      onRetry: (_attempt, _error) => {
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 1000;
        return this.delay(jitter);
      },
    });
  }

  async retryNetworkOnly<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
  ): Promise<RetryResult<T>> {
    return this.retry(operation, {
      maxAttempts,
      retryCondition: (error) => {
        // Only retry network-related errors
        return !!(
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "TypeError" &&
          "message" in error &&
          typeof error.message === "string" &&
          error.message.includes("fetch")
        );
      },
    });
  }

  // Batch retry for multiple operations
  async retryBatch<T>(
    operations: Array<() => Promise<T>>,
    options: RetryOptions = {},
  ): Promise<Array<RetryResult<T>>> {
    const results = await Promise.allSettled(
      operations.map((operation) => this.retry(operation, options)),
    );

    return results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason,
          attempts: 0,
        };
      }
    });
  }
}

export const retryLogic = new RetryLogic();
