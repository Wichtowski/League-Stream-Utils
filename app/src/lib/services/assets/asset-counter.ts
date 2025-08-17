import { DataDragonClient } from "@lib/services/external/DataDragon/client";

export interface AssetCounts {
  champions: number;
  items: number;
  gameUI: number;
  runes: number;
  spells: number;
  total: number;
}

export interface AssetCountProgress {
  stage: "counting" | "complete";
  category: string;
  counts: Partial<AssetCounts>;
  message: string;
}

/**
 * Service to calculate total asset counts across all categories
 * This is used to provide accurate progress tracking during asset initialization
 */
class AssetCounterService {
  private cachedCounts: AssetCounts | null = null;
  private isCounting = false;
  private progressCallbacks: ((progress: AssetCountProgress) => void)[] = [];

  onProgress(callback: (progress: AssetCountProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  private updateProgress(progress: AssetCountProgress): void {
    this.progressCallbacks.forEach(callback => callback(progress));
  }

  /**
   * Get total asset counts for all categories
   * This provides the total number of assets that will be downloaded
   */
  async getTotalAssetCounts(): Promise<AssetCounts> {
    // Clear cache to always get fresh counts
    this.cachedCounts = null;

    if (this.isCounting) {
      // Wait for current counting to complete
      while (this.isCounting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.cachedCounts || this.getEmptyCounts();
    }

    this.isCounting = true;
    const counts: Partial<AssetCounts> = {};

    try {
      // Count champions
      this.updateProgress({
        stage: "counting",
        category: "champions",
        counts,
        message: "Counting champion assets..."
      });
      counts.champions = await this.countChampionAssets();

      // Count items
      this.updateProgress({
        stage: "counting",
        category: "items",
        counts,
        message: "Counting item assets..."
      });
      counts.items = await this.countItemAssets();

      // Count game UI assets
      this.updateProgress({
        stage: "counting",
        category: "game-ui",
        counts,
        message: "Counting game UI assets..."
      });
      counts.gameUI = await this.countGameUIAssets();

      // Count runes
      this.updateProgress({
        stage: "counting",
        category: "runes",
        counts,
        message: "Counting rune assets..."
      });
      counts.runes = await this.countRuneAssets();

      // Count spells (placeholder for now)
      this.updateProgress({
        stage: "counting",
        category: "spells",
        counts,
        message: "Counting spell assets..."
      });
      counts.spells = await this.countSpellAssets();

      // Calculate total
      counts.total = (counts.champions || 0) + 
                    (counts.items || 0) + 
                    (counts.gameUI || 0) + 
                    (counts.runes || 0) + 
                    (counts.spells || 0);
      
      this.cachedCounts = counts as AssetCounts;

      this.updateProgress({
        stage: "complete",
        category: "all",
        counts: this.cachedCounts,
        message: `Total assets calculated: ${this.cachedCounts.total}`
      });

      return this.cachedCounts;
    } catch (error) {
      console.error("Error counting assets:", error);
      this.cachedCounts = this.getEmptyCounts();
      return this.cachedCounts;
    } finally {
      this.isCounting = false;
    }
  }

  /**
   * Count champion assets
   * Each champion has: 4 images + 5 ability images = 9 images per champion
   */
  private async countChampionAssets(): Promise<number> {
    try {
      const version = await DataDragonClient.getLatestVersion();
      const championsResponse = await DataDragonClient.getChampions(version);
      const allChampionKeys = Object.keys(championsResponse.data);
      const championCount = allChampionKeys.length;
      
      const ASSETS_PER_CHAMPION = 9;
      const totalChampionAssets = championCount * ASSETS_PER_CHAMPION;
      
      return totalChampionAssets;
    } catch (error) {
      console.error("Failed to count champion assets:", error);
      console.error("Error details:", error);
      return 0;
    }
  }

  /**
   * Count item assets  
   * Each item has: 1 data.json + 1 icon.png = 2 assets per item
   */
  private async countItemAssets(): Promise<number> {
    try {
      const version = await DataDragonClient.getLatestVersion();
      const itemsData = await DataDragonClient.getItems(version);
      const itemCount = Object.keys(itemsData.data).length;
      
      // Each item has 2 assets:
      // - 1 data.json file (shared across all items)
      // - 1 icon.png file
      // For counting purposes, we count only the icon since data is shared
      return itemCount;
    } catch (error) {
      console.warn("Failed to count item assets:", error);
      return 0;
    }
  }

  /**
   * Count game UI assets
   * Fixed set of overlay assets
   */
  private async countGameUIAssets(): Promise<number> {
    // Known game UI assets based on the asset categories
    const gameUIAssets = [
      "dragonpit/infernal.png",
      "dragonpit/ocean.png", 
      "dragonpit/hextech.png",
      "dragonpit/chemtech.png",
      "dragonpit/mountain.png",
      "dragonpit/elder.png",
      "dragonpit/cloud.png",
      "default/player.png",
      "scoreboard/gold.png",
      "scoreboard/grubs.png", 
      "scoreboard/tower.png",
      "atakhan/atakhan_ruinous.png",
      "atakhan/atakhan_voracious.png",
      "baronpit/baron.png",
      "baronpit/grubs.png",
      "baronpit/herald.png"
    ];
    
    return gameUIAssets.length;
  }

  /**
   * Count rune assets
   * Each rune has: 1 data.json + 1 icon.png = 2 assets per rune
   */
  private async countRuneAssets(): Promise<number> {
    try {
      const version = await DataDragonClient.getLatestVersion();
      const runesData = await DataDragonClient.getRunes(version);
      
      // Count all runes across all trees
      let runeCount = 0;
      for (const tree of runesData) {
        for (const slot of tree.slots) {
          runeCount += slot.runes.length;
        }
      }
      
      // Each rune has 1 icon
      return runeCount;
    } catch (error) {
      console.warn("Failed to count rune assets:", error);
      return 0;
    }
  }

  /**
   * Count summoner spell assets
   * Each spell has: 1 data.json + 1 icon.png = 2 assets per spell
   */
  private async countSpellAssets(): Promise<number> {
    try {
      const version = await DataDragonClient.getLatestVersion();
      const summonerData = await DataDragonClient.getSummonerSpells(version);
      
      // Count all summoner spells
      const spellCount = Object.keys(summonerData.data).length;
      
      // Each spell has 1 icon
      return spellCount;
    } catch (error) {
      console.warn("Failed to count summoner spell assets:", error);
      return 0;
    }
  }

  private getEmptyCounts(): AssetCounts {
    return {
      champions: 0,
      items: 0,
      gameUI: 0,
      runes: 0,
      spells: 0,
      total: 0
    };
  }

  /**
   * Clear cached counts (useful when version changes)
   */
  clearCache(): void {
    this.cachedCounts = null;
  }

  /**
   * Get cached counts without recalculating
   */
  getCachedCounts(): AssetCounts | null {
    return this.cachedCounts;
  }
}

export const assetCounterService = new AssetCounterService();


