import { DDRAGON_BASE_URL, DDRAGON_CDN } from "@lib/services/common/constants";

export interface DataDragonVersions {
  latest: string;
  all: string[];
}

export interface DataDragonResponse<T = unknown> {
  data: T;
  version: string;
  type?: string;
}

export interface RuneReforged {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: {
    runes: {
      id: number;
      key: string;
      icon: string;
      name: string;
    }[];
  }[];
}

/**
 * Centralized DataDragon API client to eliminate duplicate fetch patterns
 */
export class DataDragonClient {
  private static versionCache: string | null = null;
  private static versionsCache: string[] | null = null;

  /**
   * Get the latest League of Legends version
   */
  static async getLatestVersion(): Promise<string> {
    if (this.versionCache) {
      return this.versionCache;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${DDRAGON_BASE_URL}/api/versions.json`, {
        signal: controller.signal,
        headers: {
          "User-Agent": "League-Stream-Utils/1.0.0"
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch versions: ${response.status}`);
      }

      const versions = await response.json();
      this.versionCache = versions[0];
      this.versionsCache = versions;

      return this.versionCache || "15.16.1";
    } catch (error) {
      console.error("Failed to fetch Data Dragon version:", error);
      // Use a more recent fallback version
      return "15.16.1"; // Fallback version
    }
  }

  /**
   * Get all available versions
   */
  static async getAllVersions(): Promise<string[]> {
    if (this.versionsCache) {
      return this.versionsCache;
    }

    try {
      const response = await fetch(`${DDRAGON_BASE_URL}/api/versions.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch versions: ${response.status}`);
      }

      const versions = await response.json();
      this.versionsCache = versions;
      this.versionCache = versions[0];

      return this.versionsCache || ["15.16.1"];
    } catch (error) {
      console.error("Failed to fetch Data Dragon versions:", error);
      return ["15.16.1"]; // Fallback versions
    }
  }

  /**
   * Generic DataDragon API fetch with error handling
   */
  static async fetchData<T>(endpoint: string, version?: string): Promise<DataDragonResponse<T>> {
    const actualVersion = version || (await this.getLatestVersion());
    const url = `${DDRAGON_CDN}/${actualVersion}/data/en_US/${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "League-Stream-Utils/1.0.0"
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        data: data.data || data,
        version: actualVersion,
        type: data.type
      };
    } catch (error) {
      console.error(`Error fetching DataDragon data from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetch champions list
   */
  static async getChampions(version?: string): Promise<DataDragonResponse<Record<string, unknown>>> {
    return this.fetchData("champion.json", version);
  }

  /**
   * Fetch specific champion data
   */
  static async getChampion(
    championKey: string,
    version?: string
  ): Promise<DataDragonResponse<Record<string, unknown>>> {
    return this.fetchData(`champion/${championKey}.json`, version);
  }

  /**
   * Fetch items list
   */
  static async getItems(version?: string): Promise<DataDragonResponse<Record<string, unknown>>> {
    return this.fetchData("item.json", version);
  }

  /**
   * Fetch summoner spells
   */
  static async getSummonerSpells(version?: string): Promise<DataDragonResponse<Record<string, unknown>>> {
    return this.fetchData("summoner.json", version);
  }

  /**
   * Get runes reforged data
   */
  static async getRunes(version?: string): Promise<RuneReforged[]> {
    const actualVersion = version || (await this.getLatestVersion());
    const url = `${DDRAGON_CDN}/${actualVersion}/data/en_US/runesReforged.json`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "League-Stream-Utils/1.0.0"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch runes data: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Clear version cache (useful for testing or when version updates)
   */
  static clearCache(): void {
    this.versionCache = null;
    this.versionsCache = null;
  }

  /**
   * Generate image URLs for assets
   */
  static getImageUrls(version: string) {
    return {
      champion: {
        square: (championKey: string) => `${DDRAGON_CDN}/${version}/img/champion/${championKey}.png`,
        splash: (championKey: string, skinNum: number = 0) =>
          `${DDRAGON_CDN}/img/champion/splash/${championKey}_${skinNum}.jpg`,
        splashCentered: (championKey: string, skinNum: number = 0) =>
          `${DDRAGON_CDN}/img/champion/centered/${championKey}_${skinNum}.jpg`,
        loading: (championKey: string, skinNum: number = 0) =>
          `${DDRAGON_CDN}/img/champion/loading/${championKey}_${skinNum}.jpg`,
        ability: (abilityImageName: string) => `${DDRAGON_CDN}/${version}/img/spell/${abilityImageName}`
      },
      item: {
        icon: (itemKey: string) => `${DDRAGON_CDN}/${version}/img/item/${itemKey}.png`
      },
      spell: {
        icon: (spellKey: string) => `${DDRAGON_CDN}/${version}/img/spell/${spellKey}.png`
      }
    };
  }
}
