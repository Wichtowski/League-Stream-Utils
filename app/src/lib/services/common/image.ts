import type { ImageStorage } from "@lib/types/tournament";
import { LOGO_SQUARE_TOLERANCE } from "./constants";

/**
 * Convert ImageStorage object into a URL that can be used in <img src>. 
 * Images are fetched from MongoDB database.
 * Handles:
 *  - external URLs (type: 'url')
 *  - database-stored images (type: 'upload' - fetches from MongoDB)
 */
export const getImageUrl = async (image?: ImageStorage): Promise<string> => {
  if (!image) {
    return "";
  }

  // External URL
  if (image.type === "url") {
    return image.url || "";
  }

  // Database-stored image - fetch from MongoDB
  if (image.type === "upload" && image.data) {
    try {
      // Fetch image data from MongoDB
      const response = await fetch(`/api/v1/assets/ingame/${image.data}`);
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.error('Failed to fetch image from database:', error);
    }
  }

  return "";
};

/**
 * Get team logo URL - uses the dedicated team logo endpoint
 */
export const getTeamLogoUrl = async (teamId: string): Promise<string> => {
  return `/api/v1/teams/${teamId}/logo`;
};

/**
 * Get tournament logo URL - uses the dedicated tournament logo endpoint
 */
export const getTournamentLogoUrl = async (tournamentId: string): Promise<string> => {
  try {
    const response = await fetch(`/api/v1/tournaments/${tournamentId}/logo`);
    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error(`Failed to fetch logo for tournament ${tournamentId}:`, error);
  }

  return "";
};


export const isAlmostSquare = (width: number, height: number, tolerance: number = LOGO_SQUARE_TOLERANCE): boolean => {
  if (width <= 0 || height <= 0) return false;
  const ratio = width / height;
  return Math.abs(1 - ratio) <= tolerance;
};