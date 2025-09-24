import {
  validateStreamBannerForm,
  validateCarouselItem,
  sanitizeStreamBannerForm,
  hasUnsavedChanges,
  formatValidationErrors
} from '../stream-banner-validation';
import type { TickerFormData, CarouselItemFormData } from '@lib/types/forms';

describe('Stream Banner Validation', () => {
  const validFormData: TickerFormData = {
    title: 'Test Tournament',
    titleBackgroundColor: '#1f2937',
    titleTextColor: '#ffffff',
    carouselItems: [
      {
        text: 'Welcome to the tournament',
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        order: 0
      }
    ],
    carouselSpeed: 50,
    carouselBackgroundColor: '#1f2937'
  };

  describe('validateStreamBannerForm', () => {
    it('should pass validation for valid form data', () => {
      const errors = validateStreamBannerForm(validFormData);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for missing title', () => {
      const invalidData = { ...validFormData, title: '' };
      const errors = validateStreamBannerForm(invalidData);
      
      expect(errors).toContainEqual({
        field: 'title',
        message: 'Title is required',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should fail validation for invalid carousel speed', () => {
      const invalidData = { ...validFormData, carouselSpeed: 5 };
      const errors = validateStreamBannerForm(invalidData);
      
      expect(errors).toContainEqual({
        field: 'carouselSpeed',
        message: 'Carousel speed must be between 10 and 200',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should fail validation for invalid colors', () => {
      const invalidData = { 
        ...validFormData, 
        titleBackgroundColor: 'invalid-color' 
      };
      const errors = validateStreamBannerForm(invalidData);
      
      expect(errors).toContainEqual({
        field: 'titleBackgroundColor',
        message: 'Title background color must be a valid hex color (e.g., #ffffff)',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should fail validation for empty carousel items', () => {
      const invalidData = { ...validFormData, carouselItems: [] };
      const errors = validateStreamBannerForm(invalidData);
      
      expect(errors).toContainEqual({
        field: 'carouselItems',
        message: 'At least one carousel item is required',
        code: 'MIN_ITEMS_REQUIRED'
      });
    });

    it('should fail validation for too many carousel items', () => {
      const tooManyItems = Array(21).fill(null).map((_, index) => ({
        text: `Item ${index}`,
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        order: index
      }));
      
      const invalidData = { ...validFormData, carouselItems: tooManyItems };
      const errors = validateStreamBannerForm(invalidData);
      
      expect(errors).toContainEqual({
        field: 'carouselItems',
        message: 'Maximum 20 carousel items allowed',
        code: 'MAX_ITEMS_EXCEEDED'
      });
    });

    it('should fail validation for duplicate carousel item texts', () => {
      const duplicateItems = [
        { text: 'Same text', backgroundColor: '#1f2937', textColor: '#ffffff', order: 0 },
        { text: 'Same text', backgroundColor: '#1f2937', textColor: '#ffffff', order: 1 }
      ];
      
      const invalidData = { ...validFormData, carouselItems: duplicateItems };
      const errors = validateStreamBannerForm(invalidData);
      
      expect(errors).toContainEqual({
        field: 'carouselItems',
        message: 'Carousel items must have unique text',
        code: 'DUPLICATE_ITEMS'
      });
    });

    it('should validate individual carousel items', () => {
      const invalidItems = [
        { text: '', backgroundColor: '#1f2937', textColor: '#ffffff', order: 0 },
        { text: 'Valid text', backgroundColor: 'invalid', textColor: '#ffffff', order: 1 }
      ];
      
      const invalidData = { ...validFormData, carouselItems: invalidItems };
      const errors = validateStreamBannerForm(invalidData);
      
      expect(errors).toContainEqual({
        field: 'carouselItem_0_text',
        message: 'Text is required',
        code: 'VALIDATION_ERROR'
      });
      
      expect(errors).toContainEqual({
        field: 'carouselItem_1_backgroundColor',
        message: 'Background color must be a valid hex color (e.g., #ffffff)',
        code: 'VALIDATION_ERROR'
      });
    });
  });

  describe('validateCarouselItem', () => {
    it('should pass validation for valid carousel item', () => {
      const validItem: CarouselItemFormData = {
        text: 'Valid text',
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        order: 0
      };
      
      const errors = validateCarouselItem(validItem);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for invalid carousel item', () => {
      const invalidItem: CarouselItemFormData = {
        text: '',
        backgroundColor: 'invalid',
        textColor: '#ffffff',
        order: 0
      };
      
      const errors = validateCarouselItem(invalidItem);
      expect(errors).toHaveLength(2);
    });
  });

  describe('sanitizeStreamBannerForm', () => {
    it('should sanitize form data', () => {
      const dirtyData: TickerFormData = {
        title: '  Test Tournament  ',
        titleBackgroundColor: '',
        titleTextColor: '',
        carouselItems: [
          { text: '  Item 1  ', backgroundColor: '', textColor: '', order: 0 },
          { text: '', backgroundColor: '#000000', textColor: '#ffffff', order: 1 }, // Empty text should be removed
          { text: 'Item 2', backgroundColor: '#123456', textColor: '#abcdef', order: 2 }
        ],
        carouselSpeed: 300, // Should be clamped to 200
        carouselBackgroundColor: ''
      };

      const sanitized = sanitizeStreamBannerForm(dirtyData);

      expect(sanitized).toEqual({
        title: 'Test Tournament',
        titleBackgroundColor: '#1f2937',
        titleTextColor: '#ffffff',
        carouselItems: [
          { text: 'Item 1', backgroundColor: '#1f2937', textColor: '#ffffff', order: 0 },
          { text: 'Item 2', backgroundColor: '#123456', textColor: '#abcdef', order: 1 }
        ],
        carouselSpeed: 200,
        carouselBackgroundColor: '#1f2937'
      });
    });

    it('should clamp carousel speed to valid range', () => {
      const lowSpeed = sanitizeStreamBannerForm({ ...validFormData, carouselSpeed: 5 });
      const highSpeed = sanitizeStreamBannerForm({ ...validFormData, carouselSpeed: 300 });

      expect(lowSpeed.carouselSpeed).toBe(10);
      expect(highSpeed.carouselSpeed).toBe(200);
    });
  });

  describe('hasUnsavedChanges', () => {
    it('should detect changes in form data', () => {
      const original = { ...validFormData };
      const modified = { ...validFormData, title: 'Modified Title' };

      expect(hasUnsavedChanges(modified, original)).toBe(true);
      expect(hasUnsavedChanges(original, original)).toBe(false);
    });

    it('should detect changes when original is null', () => {
      expect(hasUnsavedChanges(validFormData, null)).toBe(true);
      
      const emptyData: TickerFormData = {
        title: '',
        titleBackgroundColor: '#1f2937',
        titleTextColor: '#ffffff',
        carouselItems: [],
        carouselSpeed: 50,
        carouselBackgroundColor: '#1f2937'
      };
      
      expect(hasUnsavedChanges(emptyData, null)).toBe(false);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format validation errors for display', () => {
      const errors = [
        { field: 'title', message: 'Title is required', code: 'VALIDATION_ERROR' },
        { field: 'carouselSpeed', message: 'Speed must be between 10 and 200', code: 'VALIDATION_ERROR' }
      ];

      const formatted = formatValidationErrors(errors);

      expect(formatted).toEqual({
        title: 'Title is required',
        carouselSpeed: 'Speed must be between 10 and 200'
      });
    });
  });
});