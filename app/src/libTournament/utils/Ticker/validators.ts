import { ValidationError, validateFormData, validators } from "@lib/utils/error-handling";
import type { TickerFormData, CarouselItemFormData } from "@libTournament/types";

/**
 * Stream banner specific validation rules
 */
export const streamBannerValidators = {
  title: validators.required("Title"),
  titleBackgroundColor: validators.color("Title background color"),
  titleTextColor: validators.color("Title text color"),
  carouselSpeed: validators.range("Carousel speed", 10, 200),
  carouselBackgroundColor: validators.color("Carousel background color")
};

/**
 * Carousel item specific validation rules
 */
export const carouselItemValidators = {
  text: validators.required("Text"),
  backgroundColor: validators.color("Background color"),
  textColor: validators.color("Text color")
};

/**
 * Validates stream banner form data
 */
export const validateStreamBannerForm = (formData: TickerFormData): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate main form fields
  const mainErrors = validateFormData(formData, streamBannerValidators);
  errors.push(...mainErrors);

  // Validate carousel items
  formData.carouselItems.forEach((item, index) => {
    const itemErrors = validateFormData(item, carouselItemValidators);

    // Add index to field names for carousel items
    itemErrors.forEach((error) => {
      errors.push({
        ...error,
        field: `carouselItem_${index}_${error.field}`
      });
    });
  });

  // Custom validation rules
  if (formData.carouselItems.length === 0) {
    errors.push({
      field: "carouselItems",
      message: "At least one carousel item is required",
      code: "MIN_ITEMS_REQUIRED"
    });
  }

  if (formData.carouselItems.length > 20) {
    errors.push({
      field: "carouselItems",
      message: "Maximum 20 carousel items allowed",
      code: "MAX_ITEMS_EXCEEDED"
    });
  }

  // Check for duplicate carousel item texts
  const itemTexts = formData.carouselItems.map((item) => item.text.trim().toLowerCase());
  const duplicates = itemTexts.filter((text, index) => text && itemTexts.indexOf(text) !== index);

  if (duplicates.length > 0) {
    errors.push({
      field: "carouselItems",
      message: "Carousel items must have unique text",
      code: "DUPLICATE_ITEMS"
    });
  }

  return errors;
};

/**
 * Validates a single carousel item
 */
export const validateCarouselItem = (item: CarouselItemFormData): ValidationError[] => {
  return validateFormData(item, carouselItemValidators);
};

/**
 * Sanitizes form data before submission
 */
export const sanitizeStreamBannerForm = (formData: TickerFormData): TickerFormData => {
  return {
    ...formData,
    title: formData.title.trim(),
    titleBackgroundColor: formData.titleBackgroundColor?.trim() || "#1f2937",
    titleTextColor: formData.titleTextColor?.trim() || "#ffffff",
    carouselBackgroundColor: formData.carouselBackgroundColor?.trim() || "#1f2937",
    carouselSpeed: Math.max(10, Math.min(200, formData.carouselSpeed || 50)),
    carouselItems: formData.carouselItems
      .filter((item) => item.text.trim()) // Remove empty items
      .map((item, index) => ({
        ...item,
        text: item.text.trim(),
        backgroundColor: item.backgroundColor?.trim() || "#1f2937",
        textColor: item.textColor?.trim() || "#ffffff",
        order: index
      }))
  };
};

/**
 * Checks if form data has unsaved changes
 */
export const hasUnsavedChanges = (currentData: TickerFormData, originalData: TickerFormData | null): boolean => {
  if (!originalData) {
    return currentData.title.trim() !== "" || currentData.carouselItems.length > 0;
  }

  return (
    JSON.stringify(sanitizeStreamBannerForm(currentData)) !== JSON.stringify(sanitizeStreamBannerForm(originalData))
  );
};

/**
 * Formats validation errors for display
 */
export const formatValidationErrors = (errors: ValidationError[]): Record<string, string> => {
  const formatted: Record<string, string> = {};

  errors.forEach((error) => {
    formatted[error.field] = error.message;
  });

  return formatted;
};

/**
 * Gets field-specific error message
 */
export const getFieldError = (errors: ValidationError[], field: string): string | null => {
  const error = errors.find((e) => e.field === field);
  return error ? error.message : null;
};
