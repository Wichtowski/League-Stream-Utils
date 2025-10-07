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
  private static readonly FALLBACK_DEPTH = 5;

  /**
   * Scrapes the CommunityDragon spells page to get the list of available spells
   * @param version The game version (e.g., "15.18.1" -> "15.18")
   * @returns Array of spell information
   */
  static async getAvailableSpells(version: string): Promise<CommunityDragonSpell[]> {
    try {
      // Convert full version (15.18.1) to major version (15.18) for CommunityDragon
      const majorVersion = this.getMajorVersion(version);
      const resolvedVersion = await this.resolveBestVersionWithFallback(majorVersion);

      // Since we can't directly scrape HTML in the browser, we'll use the predefined list
      // from rawDDragonGameSpells.ts and construct the URLs
      const spells = await this.getSpellsFromPredefinedList(resolvedVersion);
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

  private static async resolveBestVersionWithFallback(majorVersion: string): Promise<string> {
    const [majorStr, minorStr] = majorVersion.split(".");
    const major = Number(majorStr);
    const startMinor = Number(minorStr);

    if (Number.isNaN(major) || Number.isNaN(startMinor)) {
      return majorVersion;
    }

    for (let i = 0; i <= this.FALLBACK_DEPTH; i++) {
      const candidateMinor = startMinor - i;
      if (candidateMinor < 0) break;
      const candidate = `${major}.${candidateMinor}`;
      const ok = await this.versionHasAssets(candidate);
      if (ok) return candidate;
    }
    return majorVersion;
  }

  private static async versionHasAssets(majorVersion: string): Promise<boolean> {
    const probeFile = "summoner_flash.png";
    const url = `${this.COMMUNITY_DRAGON_BASE_URL}/${majorVersion}${this.SPELLS_PATH}${probeFile}`;
    if (typeof window !== "undefined") {
      return await new Promise<boolean>((resolve) => {
        const img = new Image();
        const timeoutId = window.setTimeout(() => {
          img.onload = null;
          img.onerror = null;
          resolve(false);
        }, 4000);
        img.onload = () => {
          window.clearTimeout(timeoutId);
          resolve(true);
        };
        img.onerror = () => {
          window.clearTimeout(timeoutId);
          resolve(false);
        };
        img.src = url;
      });
    }
    try {
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
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
