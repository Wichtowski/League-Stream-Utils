/**
 * Service for downloading additional game spells from CommunityDragon
 * These are additional summoner spells and game-related spell icons not available in DataDragon
 */

export interface CommunityDragonSpell {
  name: string;
  filename: string;
  url: string;
}

export class CommunityDragonSpellsService {
  private static readonly COMMUNITY_DRAGON_BASE_URL = "https://raw.communitydragon.org";
  private static readonly SPELLS_PATH = "/game/data/spells/icons2d/";

  /**
   * Scrapes the CommunityDragon spells page to get the list of available spells
   * @param version The game version (e.g., "15.18.1" -> "15.18")
   * @returns Array of spell information
   */
  static async getAvailableSpells(version: string): Promise<CommunityDragonSpell[]> {
    try {
      // Convert full version (15.18.1) to major version (15.18) for CommunityDragon
      const majorVersion = this.getMajorVersion(version);

      // Since we can't directly scrape HTML in the browser, we'll use the predefined list
      // from rawDDragonGameSpells.ts and construct the URLs
      const spells = await this.getSpellsFromPredefinedList(majorVersion);
      return spells;
    } catch (error) {
      console.error("Failed to get available spells from CommunityDragon:", error);
      return [];
    }
  }

  /**
   * Converts full version (15.18.1) to major version (15.18) for CommunityDragon
   * @param version Full version string
   * @returns Major version string
   */
  private static getMajorVersion(version: string): string {
    // Split by dots and take only the first two parts (major.minor)
    const parts = version.split(".");
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1]}`;
    }
    return version; // Fallback to original if parsing fails
  }

  /**
   * Gets spells from the predefined list in rawDDragonGameSpells.ts
   * This is a fallback when direct scraping isn't possible
   */
  private static async getSpellsFromPredefinedList(version: string): Promise<CommunityDragonSpell[]> {
    // Import the spells list dynamically to avoid circular dependencies
    const { spells } = await import("./rawDDragonGameSpells");

    const result = spells.map((filename) => ({
      name: filename.replace(".png", "").replace(/_/g, " "),
      filename,
      url: `${this.COMMUNITY_DRAGON_BASE_URL}/${version}${this.SPELLS_PATH}${filename}`
    }));

    // Log a few sample URLs for debugging

    return result;
  }

  /**
   * Downloads a single spell image
   * @param spell The spell information
   * @param version The game version (will be converted to major version)
   * @returns The local path where the image was saved
   */
  static async downloadSpellImage(spell: CommunityDragonSpell, version: string): Promise<string> {
    // Use the full version for the local path, but major version for the URL
    const imagePath = `${version}/summoner-spells/${spell.filename}`;

    // This will be handled by the summoner spell service's downloadImage method
    return imagePath;
  }

  /**
   * Gets the total count of available spells
   * @param version The game version (will be converted to major version)
   * @returns The total number of spells available
   */
  static async getSpellCount(version: string): Promise<number> {
    const spells = await this.getAvailableSpells(version);
    return spells.length;
  }
}
