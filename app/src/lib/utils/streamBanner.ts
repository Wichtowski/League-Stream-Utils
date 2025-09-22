import { StreamBannerFormData, CarouselItemFormData } from "@lib/types/forms";
import { CreateStreamBannerRequest, UpdateStreamBannerRequest, StreamBanner, CarouselItem } from "@lib/types/tournament";

/**
 * Converts form data to API request format for creating a new stream banner
 */
export const formDataToCreateRequest = (formData: StreamBannerFormData): CreateStreamBannerRequest => {
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
 * Converts form data to API request format for updating an existing stream banner
 */
export const formDataToUpdateRequest = (formData: StreamBannerFormData, bannerId: string): UpdateStreamBannerRequest => {
    return {
        _id: bannerId,
        ...formDataToCreateRequest(formData)
    };
};

/**
 * Converts a stream banner from the API to form data format
 */
export const streamBannerToFormData = (banner: StreamBanner): StreamBannerFormData => {
    return {
        title: banner.title,
        titleBackgroundColor: banner.titleBackgroundColor || "#1f2937",
        titleTextColor: banner.titleTextColor || "#ffffff",
        carouselItems: (banner.carouselItems || []).map(item => ({
            text: item.text,
            backgroundColor: item.backgroundColor || "#1f2937",
            textColor: item.textColor || "#ffffff",
            order: item.order
        })),
        carouselSpeed: banner.carouselSpeed,
        carouselBackgroundColor: banner.carouselBackgroundColor || "#1f2937",
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