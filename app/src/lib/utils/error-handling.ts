/**
 * Comprehensive error handling utilities for the application
 */

export interface ApiError {
  message: string | Error | undefined | null;
  status: number;
  code?: string | undefined | null;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff?: "linear" | "exponential";
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Creates a standardized API error from a response
 */
export const createApiError = async (response: Response): Promise<ApiError> => {
  let errorData: Record<string, unknown> = {};

  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      errorData = await response.json();
    } else {
      const textResponse = await response.text();
      errorData = textResponse ? { message: textResponse } : { message: "Empty response body" };
    }
  } catch (error) {
    console.error("Error parsing API response:", error);
    errorData = { message: "Failed to parse error response" };
  }

  // Handle empty response body
  if (Object.keys(errorData).length === 0) {
    errorData = { message: "Empty response body" };
  }

  const errorField = (errorData as Record<string, unknown>)["error"];
  const messageField = (errorData as Record<string, unknown>)["message"];
  const codeField = (errorData as Record<string, unknown>)["code"];
  const detailsField = (errorData as Record<string, unknown>)["details"];

  const message =
    (typeof errorField === "string" && errorField) ||
    (typeof messageField === "string" && messageField) ||
    `HTTP ${response.status}`;

  const code = typeof codeField === "string" ? codeField : undefined;
  const details =
    detailsField && typeof detailsField === "object" && !Array.isArray(detailsField)
      ? (detailsField as Record<string, unknown>)
      : undefined;

  return {
    message,
    status: response.status,
    code,
    details
  };
};

/**
 * Determines if an error is retryable
 */
export const isRetryableError = (error: Error | ApiError): boolean => {
  if ("status" in error) {
    // Retry on server errors (5xx) and some client errors
    return error.status >= 500 || error.status === 408 || error.status === 429;
  }

  // Retry on network errors
  return error.name === "TypeError" || error.message.includes("fetch");
};

/**
 * Implements retry logic with exponential backoff
 */
export const withRetry = async <T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> => {
  const { maxAttempts, delay, backoff = "exponential", shouldRetry = isRetryableError } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }

      const waitTime = backoff === "exponential" ? delay * Math.pow(2, attempt - 1) : delay * attempt;

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
};

/**
 * Validates form data and returns validation errors
 */
export const validateFormData = <T, V extends { [K in keyof T]?: (value: T[K]) => string | null }>(
  data: T,
  validators: V
): ValidationError[] => {
  const errors: ValidationError[] = [];

  (Object.keys(validators) as Array<keyof T>).forEach((field) => {
    const validator = validators[field] as ((value: T[typeof field]) => string | null) | undefined;
    if (!validator) return;

    const value = data[field] as T[typeof field];
    const error = validator(value);

    if (error) {
      errors.push({
        field: String(field),
        message: error,
        code: "VALIDATION_ERROR"
      });
    }
  });

  return errors;
};

/**
 * Common validation functions
 */
export const validators = {
  required:
    (fieldName: string) =>
    (value: unknown): string | null => {
      if (value === null || value === undefined || String(value).trim() === "") {
        return `${fieldName} is required`;
      }
      return null;
    },

  minLength:
    (fieldName: string, min: number) =>
    (value: string): string | null => {
      if (value && value.length < min) {
        return `${fieldName} must be at least ${min} characters`;
      }
      return null;
    },

  maxLength:
    (fieldName: string, max: number) =>
    (value: string): string | null => {
      if (value && value.length > max) {
        return `${fieldName} must be no more than ${max} characters`;
      }
      return null;
    },

  range:
    (fieldName: string, min: number, max: number) =>
    (value: number): string | null => {
      if (value !== null && value !== undefined && (value < min || value > max)) {
        return `${fieldName} must be between ${min} and ${max}`;
      }
      return null;
    },

  url:
    (fieldName: string) =>
    (value: string): string | null => {
      if (value && value.trim()) {
        try {
          new URL(value);
        } catch {
          return `${fieldName} must be a valid URL`;
        }
      }
      return null;
    },

  color:
    (fieldName: string) =>
    (value: string): string | null => {
      if (value && value.trim()) {
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!colorRegex.test(value)) {
          return `${fieldName} must be a valid hex color (e.g., #ffffff)`;
        }
      }
      return null;
    }
};

/**
 * Formats error messages for user display
 */
export const formatErrorMessage = (error: Error | ApiError | string): string => {
  if (typeof error === "string") {
    return error;
  }

  if ("status" in error) {
    switch (error.status) {
      case 400:
        return (
          (error.message instanceof Error
            ? error.message.message
            : typeof error.message === "string"
              ? error.message
              : undefined) || "Invalid request. Please check your input."
        );
      case 401:
        return "You are not authorized to perform this action.";
      case 403:
        return "You do not have permission to access this resource.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "This action conflicts with existing data.";
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
        return "A server error occurred. Please try again.";
      default:
        return (
          (error.message instanceof Error
            ? error.message.message
            : typeof error.message === "string"
              ? error.message
              : undefined) || "An unexpected error occurred."
        );
    }
  }

  return error.message || "An unexpected error occurred.";
};

/**
 * Logs errors with context information
 */
export const logError = (error: Error | ApiError, context?: Record<string, unknown>): void => {
  const errorInfo = {
    message:
      "status" in error
        ? error.message instanceof Error
          ? error.message.message
          : typeof error.message === "string"
            ? error.message
            : String(error.message ?? "")
        : error.message,
    stack: "stack" in error ? error.stack : undefined,
    status: "status" in error ? error.status : undefined,
    context,
    timestamp: new Date().toISOString(),
    rawError: error // Add raw error for debugging
  };

  console.error("Application Error:", errorInfo);

  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === "production") {
    // Example: Send to error tracking service
    // errorTrackingService.captureError(errorInfo);
  }
};
