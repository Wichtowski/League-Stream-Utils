import { StreamBannerFormData, CarouselItemFormData } from "@lib/types/forms";

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

export const validateCarouselItem = (item: CarouselItemFormData): ValidationResult => {
    const errors: ValidationError[] = [];

    if (!item.text || item.text.trim().length === 0) {
        errors.push({ field: "text", message: "Text is required" });
    }

    if (item.text && item.text.length > 200) {
        errors.push({ field: "text", message: "Text must be 200 characters or less" });
    }

    if (!item.backgroundColor || !isValidHexColor(item.backgroundColor)) {
        errors.push({ field: "backgroundColor", message: "Valid background color is required" });
    }

    if (!item.textColor || !isValidHexColor(item.textColor)) {
        errors.push({ field: "textColor", message: "Valid text color is required" });
    }

    if (typeof item.order !== "number" || item.order < 0) {
        errors.push({ field: "order", message: "Order must be a non-negative number" });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export const validateStreamBanner = (banner: StreamBannerFormData): ValidationResult => {
    const errors: ValidationError[] = [];

    if (!banner.title || banner.title.trim().length === 0) {
        errors.push({ field: "title", message: "Title is required" });
    }

    if (banner.title && banner.title.length > 100) {
        errors.push({ field: "title", message: "Title must be 100 characters or less" });
    }

    if (typeof banner.displayDuration !== "number" || banner.displayDuration < 1 || banner.displayDuration > 60) {
        errors.push({ field: "displayDuration", message: "Display duration must be between 1 and 60 seconds" });
    }

    if (typeof banner.carouselSpeed !== "number" || banner.carouselSpeed < 10 || banner.carouselSpeed > 200) {
        errors.push({ field: "carouselSpeed", message: "Carousel speed must be between 10 and 200 pixels per second" });
    }

    if (typeof banner.priority !== "number" || banner.priority < 0) {
        errors.push({ field: "priority", message: "Priority must be a non-negative number" });
    }

    // Validate carousel items
    banner.carouselItems.forEach((item, index) => {
        const itemValidation = validateCarouselItem(item);
        if (!itemValidation.isValid) {
            itemValidation.errors.forEach(error => {
                errors.push({
                    field: `carouselItems[${index}].${error.field}`,
                    message: error.message
                });
            });
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};

const isValidHexColor = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};