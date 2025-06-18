interface BackoffOptions {
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  maxRetries?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions = {}
): Promise<T> {
  const {
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    maxRetries = 5,
    onRetry
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      const delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
      
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}