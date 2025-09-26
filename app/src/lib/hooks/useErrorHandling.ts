import { useState, useCallback } from "react";
import { useModal } from "@lib/contexts/ModalContext";
import {
  ApiError,
  ValidationError,
  RetryOptions,
  withRetry,
  formatErrorMessage,
  logError,
  createApiError
} from "@lib/utils/error-handling";

export interface UseErrorHandlingOptions {
  showUserErrors?: boolean;
  logErrors?: boolean;
  context?: Record<string, unknown>;
}

export interface UseErrorHandlingReturn {
  error: ApiError | null;
  validationErrors: ValidationError[];
  isLoading: boolean;
  clearError: () => void;
  clearValidationErrors: () => void;
  handleError: (error: Error | ApiError, showToUser?: boolean) => void;
  handleValidationErrors: (errors: ValidationError[]) => void;
  executeWithErrorHandling: <T>(
    fn: () => Promise<T>,
    options?: { showLoading?: boolean; showUserErrors?: boolean }
  ) => Promise<T | null>;
  executeWithRetry: <T>(
    fn: () => Promise<T>,
    retryOptions?: Partial<RetryOptions>,
    options?: { showLoading?: boolean; showUserErrors?: boolean }
  ) => Promise<T | null>;
}

/**
 * Hook for comprehensive error handling
 */
export const useErrorHandling = (options: UseErrorHandlingOptions = {}): UseErrorHandlingReturn => {
  const { showUserErrors = true, logErrors = true, context } = options;
  const { showAlert } = useModal();

  const [error, setError] = useState<ApiError | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  const handleError = useCallback(
    async (error: Error | ApiError, showToUser: boolean = showUserErrors) => {
      const apiError =
        "status" in error
          ? error
          : ({
              message: error.message,
              status: 0
            } as ApiError);

      setError(apiError);

      if (logErrors) {
        logError(apiError, context);
      }

      if (showToUser) {
        await showAlert({
          type: "error",
          title: "Error",
          message: formatErrorMessage(apiError)
        });
      }
    },
    [showUserErrors, logErrors, context, showAlert]
  );

  const handleValidationErrors = useCallback((errors: ValidationError[]) => {
    setValidationErrors(errors);
  }, []);

  const executeWithErrorHandling = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options: { showLoading?: boolean; showUserErrors?: boolean } = {}
    ): Promise<T | null> => {
      const { showLoading = true, showUserErrors: showErrors = showUserErrors } = options;

      try {
        if (showLoading) setIsLoading(true);
        clearError();
        clearValidationErrors();

        const result = await fn();
        return result;
      } catch (error) {
        const apiError = error instanceof Error ? error : new Error(String(error));
        await handleError(apiError, showErrors);
        return null;
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [showUserErrors, handleError, clearError, clearValidationErrors]
  );

  const executeWithRetry = useCallback(
    async <T>(
      fn: () => Promise<T>,
      retryOptions: Partial<RetryOptions> = {},
      options: { showLoading?: boolean; showUserErrors?: boolean } = {}
    ): Promise<T | null> => {
      const { showLoading = true, showUserErrors: showErrors = showUserErrors } = options;
      const defaultRetryOptions: RetryOptions = {
        maxAttempts: 3,
        delay: 1000,
        backoff: "exponential",
        ...retryOptions
      };

      try {
        if (showLoading) setIsLoading(true);
        clearError();
        clearValidationErrors();

        const result = await withRetry(fn, defaultRetryOptions);
        return result;
      } catch (error) {
        const apiError = error instanceof Error ? error : new Error(String(error));
        await handleError(apiError, showErrors);
        return null;
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [showUserErrors, handleError, clearError, clearValidationErrors]
  );

  return {
    error,
    validationErrors,
    isLoading,
    clearError,
    clearValidationErrors,
    handleError,
    handleValidationErrors,
    executeWithErrorHandling,
    executeWithRetry
  };
};

/**
 * Hook for API calls with built-in error handling
 */
export const useApiCall = () => {
  const errorHandling = useErrorHandling();

  const apiCall = useCallback(
    async <T>(url: string, options: RequestInit = {}, retryOptions?: Partial<RetryOptions>): Promise<T | null> => {
      const makeRequest = async (): Promise<T> => {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...options.headers
          },
          ...options
        });

        if (!response.ok) {
          throw await createApiError(response);
        }

        return response.json();
      };

      if (retryOptions) {
        return errorHandling.executeWithRetry(makeRequest, retryOptions);
      } else {
        return errorHandling.executeWithErrorHandling(makeRequest);
      }
    },
    [errorHandling]
  );

  return {
    ...errorHandling,
    apiCall
  };
};
