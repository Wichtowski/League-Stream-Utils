import { 
  createApiError, 
  isRetryableError, 
  withRetry, 
  validateFormData, 
  validators, 
  formatErrorMessage 
} from '../error-handling';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createApiError', () => {
    it('should create API error from JSON response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR'
        })
      } as unknown as Response;

      const error = await createApiError(mockResponse);

      expect(error).toEqual({
        message: 'Validation failed',
        status: 400,
        code: 'VALIDATION_ERROR',
        details: undefined
      });
    });

    it('should handle non-JSON responses', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        headers: {
          get: jest.fn().mockReturnValue('text/plain')
        },
        text: jest.fn().mockResolvedValue('Internal Server Error')
      } as unknown as Response;

      const error = await createApiError(mockResponse);

      expect(error).toEqual({
        message: 'Internal Server Error',
        status: 500,
        code: undefined,
        details: undefined
      });
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable HTTP errors', () => {
      expect(isRetryableError({ message: 'Server Error', status: 500 })).toBe(true);
      expect(isRetryableError({ message: 'Timeout', status: 408 })).toBe(true);
      expect(isRetryableError({ message: 'Rate Limited', status: 429 })).toBe(true);
    });

    it('should identify non-retryable HTTP errors', () => {
      expect(isRetryableError({ message: 'Bad Request', status: 400 })).toBe(false);
      expect(isRetryableError({ message: 'Not Found', status: 404 })).toBe(false);
      expect(isRetryableError({ message: 'Unauthorized', status: 401 })).toBe(false);
    });

    it('should identify retryable network errors', () => {
      const networkError = new TypeError('Failed to fetch');
      expect(isRetryableError(networkError)).toBe(true);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(mockFn, {
        maxAttempts: 3,
        delay: 100
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        maxAttempts: 3,
        delay: 10
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockFn = jest.fn().mockRejectedValue({ message: 'Bad Request', status: 400 });

      await expect(withRetry(mockFn, {
        maxAttempts: 3,
        delay: 10
      })).rejects.toEqual({ message: 'Bad Request', status: 400 });

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('validators', () => {
    it('should validate required fields', () => {
      const validator = validators.required('Name');
      
      expect(validator('')).toBe('Name is required');
      expect(validator('  ')).toBe('Name is required');
      expect(validator(null)).toBe('Name is required');
      expect(validator('John')).toBe(null);
    });

    it('should validate string length', () => {
      const minValidator = validators.minLength('Password', 8);
      const maxValidator = validators.maxLength('Title', 50);
      
      expect(minValidator('short')).toBe('Password must be at least 8 characters');
      expect(minValidator('longenough')).toBe(null);
      
      expect(maxValidator('a'.repeat(51))).toBe('Title must be no more than 50 characters');
      expect(maxValidator('short')).toBe(null);
    });

    it('should validate numeric ranges', () => {
      const validator = validators.range('Speed', 10, 100);
      
      expect(validator(5)).toBe('Speed must be between 10 and 100');
      expect(validator(150)).toBe('Speed must be between 10 and 100');
      expect(validator(50)).toBe(null);
    });

    it('should validate colors', () => {
      const validator = validators.color('Background');
      
      expect(validator('#ffffff')).toBe(null);
      expect(validator('#fff')).toBe(null);
      expect(validator('invalid')).toBe('Background must be a valid hex color (e.g., #ffffff)');
      expect(validator('')).toBe(null); // Empty is allowed
    });
  });

  describe('validateFormData', () => {
    it('should validate form data with multiple validators', () => {
      const data = {
        name: '',
        email: 'invalid-email',
        age: 150
      };

      const validatorMap = {
        name: validators.required('Name'),
        email: (value: string) => value.includes('@') ? null : 'Invalid email',
        age: validators.range('Age', 0, 120)
      };

      const errors = validateFormData(data, validatorMap);

      expect(errors).toHaveLength(3);
      expect(errors[0]).toEqual({
        field: 'name',
        message: 'Name is required',
        code: 'VALIDATION_ERROR'
      });
    });
  });

  describe('formatErrorMessage', () => {
    it('should format API errors with status codes', () => {
      expect(formatErrorMessage({ message: 'Custom error', status: 400 }))
        .toBe('Custom error');
      
      expect(formatErrorMessage({ message: '', status: 404 }))
        .toBe('The requested resource was not found.');
      
      expect(formatErrorMessage({ message: '', status: 500 }))
        .toBe('A server error occurred. Please try again.');
    });

    it('should format regular errors', () => {
      const error = new Error('Something went wrong');
      expect(formatErrorMessage(error)).toBe('Something went wrong');
    });

    it('should format string errors', () => {
      expect(formatErrorMessage('Simple error')).toBe('Simple error');
    });
  });
});