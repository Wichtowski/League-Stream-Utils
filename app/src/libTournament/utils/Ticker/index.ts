import { TickerFormData, CarouselItemFormData } from "@lib/types/forms";
import { CreateTickerRequest, UpdateTickerRequest, Ticker } from "@libTournament/types";

/**
 * Converts form data to API request format for creating a new Ticker
 */
export const formDataToCreateRequest = (formData: TickerFormData): CreateTickerRequest => {
    return {
        title: formData.title.trim(),
        titleBackgroundColor: formData.titleBackgroundColor || "#1f2937",
        titleTextColor: formData.titleTextColor || "#ffffff",
        carouselItems: (formData.carouselItems || []).map((item, index) => ({
            text: item.text.trim(),
            backgroundColor: item.backgroundColor || "#1f2937",
            textColor: item.textColor || "#ffffff",
            order: item.order || index
        })),
        carouselSpeed: formData.carouselSpeed || 50,
        carouselBackgroundColor: formData.carouselBackgroundColor || "#1f2937",
    };
};

/**
 * Converts form data to API request format for updating an existing Ticker
 */
export const formDataToUpdateRequest = (formData: TickerFormData, tickerId: string): UpdateTickerRequest => {
    return {
        _id: tickerId,
        ...formDataToCreateRequest(formData)
    };
};

/**
 * Converts a Ticker from the API to form data format
 */
export const TickerToFormData = (ticker: Ticker): TickerFormData => {
    return {
        title: ticker.title,
        titleBackgroundColor: ticker.titleBackgroundColor || "#1f2937",
        titleTextColor: ticker.titleTextColor || "#ffffff",
        carouselItems: (ticker.carouselItems || []).map(item => ({
            text: item.text,
            backgroundColor: item.backgroundColor || "#1f2937",
            textColor: item.textColor || "#ffffff",
            order: item.order
        })),
        carouselSpeed: ticker.carouselSpeed,
        carouselBackgroundColor: ticker.carouselBackgroundColor || "#1f2937",
    };
};

/**
 * Creates a new carousel item with default values and proper ordering
 */
export const createNewCarouselItem = (existingItems: CarouselItemFormData[]): CarouselItemFormData => {
    const maxOrder = existingItems.length > 0 ? Math.max(...existingItems.map(item => item.order)) : -1;

    return {
        text: "",
        backgroundColor: "#1f2937",
        textColor: "#ffffff",
        order: maxOrder + 1
    };
};

/**
 * Reorders carousel items based on their new positions
 */
export const reorderCarouselItems = (items: CarouselItemFormData[], fromIndex: number, toIndex: number): CarouselItemFormData[] => {
    const reorderedItems = [...items];
    const [movedItem] = reorderedItems.splice(fromIndex, 1);
    reorderedItems.splice(toIndex, 0, movedItem);

    // Update order values to match new positions
    return reorderedItems.map((item, index) => ({
        ...item,
        order: index
    }));
};