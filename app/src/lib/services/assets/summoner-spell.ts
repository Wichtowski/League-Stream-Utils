import { SummonerSpell, DataDragonSummonerSpell, DataDragonSummonerResponse, SummonerSpellCacheData } from "../../types/summoner-spell";
import { DDRAGON_CDN } from "@lib/services/common/constants";
import { BaseCacheService } from "@lib/services/assets/base";

class SummonerSpellCacheService extends BaseCacheService<SummonerSpell> {
  private isMainDownloadRunning = false;
  private summonerDataCache: DataDragonSummonerResponse | null = null;
  private summonerDataVersion: string | null = null;

  async getAll(): Promise<SummonerSpell[]> {
    return this.getAllSummonerSpells(this.isMainDownloadRunning);
  }

  async getById(key: string): Promise<SummonerSpell | null> {
    return this.getSummonerSpellByKey(key);
  }

  private async getSummonerData(version: string): Promise<DataDragonSummonerResponse> {
    // Use cached data if available for the same version
    if (this.summonerDataCache && this.summonerDataVersion === version) {
      return this.summonerDataCache;
    }

    const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/summoner.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch summoner spells: ${response.status}`);
    }

    const summonerData: DataDragonSummonerResponse = await response.json();
    
    // Cache the data and version
    this.summonerDataCache = summonerData;
    this.summonerDataVersion = version;
    
    return summonerData;
  }

  async downloadSummonerSpellData(spellKey: string, version: string): Promise<SummonerSpellCacheData> {
    await this.initialize();

    if (typeof window === "undefined" || !window.electronAPI) {
      throw new Error("Electron API not available");
    }

    const dataKey = `summoner-spell-${version}-${spellKey}-data`;

    const manifestResult = await window.electronAPI.loadCategoryManifest("summoner-spells");
    if (manifestResult.success && manifestResult.data) {
      const manifest = manifestResult.data;
      if (manifest[dataKey]) {
        const loadResult = await window.electronAPI.loadCategoryManifest("summoner-spells");
        if (loadResult.success && loadResult.data) {
          const cachedData = loadResult.data[dataKey];
          if (cachedData) {
            return JSON.parse(cachedData.path);
          }
        }
      }
    }

    const summonerData = await this.getSummonerData(version);
    const spell = summonerData.data[spellKey];

    if (!spell) {
      throw new Error(`Summoner spell ${spellKey} not found in DataDragon response`);
    }

    const image = await this.downloadSummonerSpellImage(spell, version);

    const cacheData: SummonerSpellCacheData = {
      id: spell.id,
      name: spell.name,
      key: spell.key,
      description: spell.description,
      maxrank: spell.maxrank,
      cooldown: spell.cooldown,
      cost: spell.cost,
      range: spell.range,
      image
    };

    await this.saveSummonerSpellData(spellKey, version, cacheData);

    return cacheData;
  }

  private async downloadSummonerSpellImage(
    spell: DataDragonSummonerSpell,
    version: string
  ): Promise<string> {
    const imageUrl = `${DDRAGON_CDN}/${version}/img/spell/${spell.image.full}`;
    // Store all images in a flat structure: {version}/summoner-spells/{imageName}
    const imagePath = `${version}/summoner-spells/${spell.image.full}`;

    const success = await this.downloadImage(imageUrl, imagePath);
    if (!success) {
      throw new Error(`Failed to download image for ${spell.key}`);
    }

    return imagePath;
  }

  private async saveSummonerSpellData(
    spellKey: string,
    version: string,
    _data: SummonerSpellCacheData
  ): Promise<void> {
    // Don't save individual spell data to manifest - rely on category manifest system
    // Individual spell data is already tracked in the category progress
    await this.updateCategoryProgress(
      "summoner-spells",
      version,
      spellKey,
      1,
      1,
      [spellKey]
    );
  }

  async getAllSummonerSpells(suppressProgress = false): Promise<SummonerSpell[]> {
    await this.initialize();

    try {
      const version = await this.getLatestVersion();
      const summonerData = await this.getSummonerData(version);
      const spellKeys = Object.keys(summonerData.data);

      if (!suppressProgress) {
        this.updateProgress({
          current: 0,
          total: spellKeys.length,
          itemName: "summoner-spells",
          stage: "checking",
          assetType: "spell-data"
        });
      }

      const spells: SummonerSpell[] = [];

      for (let i = 0; i < spellKeys.length; i++) {
        const spellKey = spellKeys[i];
        try {
          const spell = await this.getSummonerSpellByKey(spellKey);
          if (spell) {
            spells.push(spell);
          }
        } catch (error) {
          console.error(`Failed to get summoner spell ${spellKey}:`, error);
        }

        if (!suppressProgress) {
          this.updateProgress({
            current: i + 1,
            total: spellKeys.length,
            itemName: spellKey,
            stage: "checking",
            assetType: "spell-data",
            currentAsset: spellKey
          });
        }
      }

      return spells;
    } catch (error) {
      console.error("Failed to get all summoner spells:", error);
      return [];
    }
  }

  async getSummonerSpellByKey(key: string): Promise<SummonerSpell | null> {
    await this.initialize();

    if (typeof window === "undefined" || !window.electronAPI) {
      return null;
    }

    try {
      const version = await this.getLatestVersion();
      const dataKey = `summoner-spell-${version}-${key}-data`;

      const manifestResult = await window.electronAPI.loadCategoryManifest("summoner-spells");
      if (manifestResult.success && manifestResult.data) {
        const manifest = manifestResult.data;
        if (manifest[dataKey]) {
          const loadResult = await window.electronAPI.loadCategoryManifest("summoner-spells");
          if (loadResult.success && loadResult.data) {
            const cachedData = loadResult.data[dataKey];
            if (cachedData) {
              return JSON.parse(cachedData.path);
            }
          }
        }
      }

      const cacheData = await this.downloadSummonerSpellData(key, version);
      
      return {
        id: cacheData.id,
        name: cacheData.name,
        key: cacheData.key,
        description: cacheData.description,
        maxrank: cacheData.maxrank,
        cooldown: cacheData.cooldown,
        cost: cacheData.cost,
        range: cacheData.range,
        image: cacheData.image
      };
    } catch (error) {
      console.error(`Failed to get summoner spell ${key}:`, error);
      return null;
    }
  }

  async checkCacheCompleteness(): Promise<{
    missingSpells: string[];
    totalExpected: number;
    allSpellKeys: string[];
  }> {
    await this.initialize();

    if (typeof window === "undefined" || !window.electronAPI) {
      return { missingSpells: [], totalExpected: 0, allSpellKeys: [] };
    }

    try {
      const version = await this.getLatestVersion();
      const summonerData = await this.getSummonerData(version);
      const allSpellKeys = Object.keys(summonerData.data);
      const totalExpected = allSpellKeys.length;

      const missingSpells: string[] = [];

      for (const spellKey of allSpellKeys) {
        const dataKey = `summoner-spell-${version}-${spellKey}-data`;
        const manifestResult = await window.electronAPI.loadCategoryManifest("summoner-spells");
        
        if (manifestResult.success && manifestResult.data) {
          const manifest = manifestResult.data;
          if (!manifest[dataKey]) {
            missingSpells.push(spellKey);
          }
        } else {
          missingSpells.push(spellKey);
        }
      }

      return { missingSpells, totalExpected, allSpellKeys };
    } catch (error) {
      console.error("Failed to check cache completeness:", error);
      return { missingSpells: [], totalExpected: 0, allSpellKeys: [] };
    }
  }

  async downloadAllSummonerSpellsOnStartup(): Promise<{
    success: boolean;
    totalSpells: number;
    errors: string[];
  }> {
    await this.initialize();

    if (typeof window === "undefined" || !window.electronAPI) {
      return {
        success: false,
        totalSpells: 0,
        errors: ["Electron API not available"]
      };
    }

    try {
      this.isMainDownloadRunning = true;
      const version = await this.getLatestVersion();
      this.version = version;

      const cacheCheck = await this.checkCacheCompleteness();
      const missingSpellKeys = cacheCheck.missingSpells;
      const totalSpells = missingSpellKeys.length;
      const totalExpected = cacheCheck.totalExpected;
      const allSpellKeys = cacheCheck.allSpellKeys;
      const errors: string[] = [];

      const validCompletedSet = new Set<string>();
      
      for (const spellKey of allSpellKeys) {
        if (!missingSpellKeys.includes(spellKey)) {
          validCompletedSet.add(spellKey);
        }
      }

      console.log(`Found ${validCompletedSet.size} summoner spells already completed on disk out of ${allSpellKeys.length} total`);

      const ASSETS_PER_SPELL = 2;

      if (totalSpells === 0) {
        console.log("All summoner spells are already cached!");

        const totalAssets = totalExpected * ASSETS_PER_SPELL;
        this.updateProgress({
          current: totalAssets,
          total: totalAssets,
          itemName: `All ${totalExpected} summoner spells already cached`,
          stage: "complete",
          assetType: "spell-data",
          currentAsset: "Summoner spells downloaded successfully"
        });

        return { success: true, totalSpells: totalExpected, errors: [] };
      }

      console.log(`Found ${totalSpells} missing summoner spells to download`);

      this.updateProgress({
        current: Math.min(validCompletedSet.size, totalExpected) * ASSETS_PER_SPELL,
        total: totalExpected * ASSETS_PER_SPELL,
        itemName: "summoner-spells",
        stage: "downloading",
        assetType: "spell-data",
        currentAsset: `${validCompletedSet.size}/${totalExpected}`
      });

      let downloadedCount = 0;

      for (const spellKey of missingSpellKeys) {
        try {
          await this.downloadSummonerSpellData(spellKey, version);
          downloadedCount++;

          validCompletedSet.add(spellKey);

          await this.updateCategoryProgress(
            "summoner-spells",
            version,
            spellKey,
            totalExpected,
            Math.min(validCompletedSet.size, totalExpected),
            Array.from(validCompletedSet)
          );

          this.updateProgress({
            current: Math.min(validCompletedSet.size, totalExpected) * ASSETS_PER_SPELL,
            total: totalExpected * ASSETS_PER_SPELL,
            itemName: spellKey,
            stage: "downloading",
            assetType: "spell-data",
            currentAsset: spellKey
          });
        } catch (error) {
          const errorMsg = `Failed to download ${spellKey}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);

          downloadedCount++;

          this.updateProgress({
            current: Math.min(validCompletedSet.size, totalExpected) * ASSETS_PER_SPELL,
            total: totalExpected * ASSETS_PER_SPELL,
            itemName: spellKey,
            stage: "downloading",
            assetType: "spell-data",
            currentAsset: spellKey
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      this.updateProgress({
        current: totalExpected * ASSETS_PER_SPELL,
        total: totalExpected * ASSETS_PER_SPELL,
        itemName: `All ${totalExpected} summoner spells complete`,
        stage: "complete",
        assetType: "spell-data",
        currentAsset: "Summoner spells downloaded successfully"
      });

      if (downloadedCount > 0) {
        console.log("All summoner spells downloaded successfully");
        await this.cleanupManifestAfterSuccess();
      }

      return {
        success: downloadedCount > 0,
        totalSpells: downloadedCount,
        errors
      };
    } catch (error) {
      console.error("Failed to download summoner spells:", error);
      return {
        success: false,
        totalSpells: 0,
        errors: [`Failed to download summoner spells: ${error}`]
      };
    } finally {
      this.isMainDownloadRunning = false;
    }
  }

  private async cleanupManifestAfterSuccess(): Promise<void> {
    try {
      if (typeof window === "undefined" || !window.electronAPI) {
        return;
      }

      const version = await this.getLatestVersion();
      await this.updateCategoryProgress(
        "summoner-spells",
        version,
        "cleanup",
        this.version ? 1 : 0,
        1,
        []
      );
    } catch (error) {
      console.error("Failed to cleanup manifest:", error);
    }
  }

  /**
   * Clear the summoner spells data cache (useful when version changes)
   */
  static clearSummonerSpellsCache(): void {
    summonerSpellCacheService.summonerDataCache = null;
    summonerSpellCacheService.summonerDataVersion = null;
  }

  // Clear cache when version changes
  async clearCache(): Promise<void> {
    this.summonerDataCache = null;
    this.summonerDataVersion = null;
    await super.clearCache();
  }
}

export const summonerSpellCacheService = new SummonerSpellCacheService();
