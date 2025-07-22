// Utility functions for handling image storage and team logos
import type { ImageStorage } from '@lib/types/tournament';
import type { Team } from '@lib/types/game';

/**
 * Convert ImageStorage object into a URL that can be used in <img src>. Handles:
 *  - external URLs (type: 'url')
 *  - base64 uploads (type: 'upload' & data starts with data:)
 *  - uploaded filename references (type: 'upload' & data is a filename)
 */
export const getImageUrl = (image: ImageStorage): string => {
    // External URL
    if (image.type === 'url') {
        return image.data;
    }

    // Uploaded file reference → already stored in /uploads
    if (!image.data.startsWith('data:')) {
        return `/uploads/${image.data}`;
    }

    // Base64 string – return as-is (renderable by <img src>)
    return image.data;
};

export const getTeamLogoUrl = (team: Team, fallbackUrl = '/assets/default-team-logo.png'): string => {
    const logo = getImageUrl(team.logo);
    return logo || fallbackUrl;
}; 
