import {
  SummonerSpell,
  DataDragonSummonerSpell,
  DataDragonSummonerResponse,
  SummonerSpellCacheData
} from "@lib/types/summoner-spell";
import { DDRAGON_CDN } from "@lib/services/common/constants";
import { BaseCacheService } from "@lib/services/assets/base";
import { CommunityDragonSpellsService } from "./community-dragon-spells";

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

    // Fast-path: if image already exists on disk, construct and return cache data
    const summonerData = await this.getSummonerData(version);
    const existingSpell = summonerData.data[spellKey];
    if (!existingSpell) {
      throw new Error(`Summoner spell ${spellKey} not found in DataDragon response`);
    }
    const existingImagePath = `${version}/summoner-spells/${existingSpell.image.full}`;
    const cachedFullPath = this.getCachedPathForKey(existingImagePath);
    const alreadyExists = await this.checkFileExists(cachedFullPath);
    if (alreadyExists) {
      return {
        _id: existingSpell._id,
        name: existingSpell.name,
        key: existingSpell.key,
        description: existingSpell.description,
        maxrank: existingSpell.maxrank,
        cooldown: existingSpell.cooldown,
        cost: existingSpell.cost,
        range: existingSpell.range,
        image: existingImagePath
      };
    }

    const spell = summonerData.data[spellKey];

    if (!spell) {
      throw new Error(`Summoner spell ${spellKey} not found in DataDragon response`);
    }

    const image = await this.downloadSummonerSpellImage(spell, version);

    const cacheData: SummonerSpellCacheData = {
      _id: spell._id,
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

  private async downloadSummonerSpellImage(spell: DataDragonSummonerSpell, version: string): Promise<string> {
    const imageUrl = `${DDRAGON_CDN}/${version}/img/spell/${spell.image.full}`;
    // Store all images in a flat structure: {version}/summoner-spells/{imageName}
    const imagePath = `${version}/summoner-spells/${spell.image.full}`;

    // Check if image already exists before downloading
    const cachedFullPath = this.getCachedPathForKey(imagePath);
    const alreadyExists = await this.checkFileExists(cachedFullPath);
    if (alreadyExists) {
      return imagePath;
    }

    const success = await this.downloadImage(imageUrl, imagePath);
    if (!success) {
      throw new Error(`Failed to download image for ${spell.key}`);
    }

    return imagePath;
  }

  private async saveSummonerSpellData(spellKey: string, version: string, _data: SummonerSpellCacheData): Promise<void> {
    // Don't save individual spell data to manifest - rely on category manifest system
    // Individual spell data is already tracked in the category progress
    await this.updateCategoryProgress("summoner-spells", version, spellKey, 1, 1, [spellKey]);
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
      const summonerData = await this.getSummonerData(version);
      const spell = summonerData.data[key];
      if (spell) {
        const imagePath = `${version}/summoner-spells/${spell.image.full}`;
        const cachedFullPath = this.getCachedPathForKey(imagePath);
        const exists = await this.checkFileExists(cachedFullPath);
        if (exists) {
          return {
            _id: spell._id,
            name: spell.name,
            key: spell.key,
            description: spell.description,
            maxrank: spell.maxrank,
            cooldown: spell.cooldown,
            cost: spell.cost,
            range: spell.range,
            image: imagePath
          };
        }
      }

      const cacheData = await this.downloadSummonerSpellData(key, version);

      return {
        _id: cacheData._id,
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
        const spell = summonerData.data[spellKey]!;
        const imagePath = `${version}/summoner-spells/${spell.image.full}`;
        const cachedFullPath = this.getCachedPathForKey(imagePath);
        const exists = await this.checkFileExists(cachedFullPath);
        if (!exists) missingSpells.push(spellKey);
      }

      return { missingSpells, totalExpected, allSpellKeys };
    } catch (error) {
      console.error("Failed to check cache completeness:", error);
      return { missingSpells: [], totalExpected: 0, allSpellKeys: [] };
    }
  }

  async checkCommunityDragonSpellsCompleteness(): Promise<{
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
      const communitySpells = await CommunityDragonSpellsService.getAvailableSpells(version);
      const allSpellKeys = communitySpells.map((spell) => spell.filename);
      const totalExpected = allSpellKeys.length;

      console.log(`Checking cache completeness for ${totalExpected} CommunityDragon spells...`);

      const missingSpells: string[] = [];
      for (const spell of communitySpells) {
        const imagePath = `${version}/summoner-spells/${spell.filename}`;
        const cachedFullPath = this.getCachedPathForKey(imagePath);
        const exists = await this.checkFileExists(cachedFullPath);
        if (!exists) missingSpells.push(spell.filename);
      }

      console.log(
        `CommunityDragon cache completeness check: ${missingSpells.length} missing out of ${totalExpected} total spells`
      );

      return { missingSpells, totalExpected, allSpellKeys };
    } catch (error) {
      console.error("Failed to check CommunityDragon cache completeness:", error);
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

      // Check CommunityDragon spells completeness first
      const communityDragonCompleteness = await this.checkCommunityDragonSpellsCompleteness();
      console.log(
        `CommunityDragon spells: ${communityDragonCompleteness.missingSpells.length === 0 ? "complete" : `missing ${communityDragonCompleteness.missingSpells.length}`}`
      );

      // Download regular DataDragon summoner spells first
      const dataDragonResult = await this.downloadDataDragonSpells(version);

      // Then download additional CommunityDragon spells if needed
      let communityDragonResult = { success: true, totalSpells: 0, errors: [] as string[] };
      if (communityDragonCompleteness.missingSpells.length > 0) {
        communityDragonResult = await this.downloadCommunityDragonSpells(version);
      } else {
        console.log("All CommunityDragon spells are already cached!");
      }

      const totalSpells = dataDragonResult.totalSpells + communityDragonResult.totalSpells;
      const allErrors = [...dataDragonResult.errors, ...communityDragonResult.errors];

      this.updateProgress({
        current: totalSpells,
        total: totalSpells,
        itemName: `All ${totalSpells} summoner spells complete`,
        stage: "complete",
        assetType: "spell-data",
        currentAsset: "Summoner spells downloaded successfully"
      });

      if (totalSpells > 0) {
        await this.cleanupManifestAfterSuccess();
      }

      return {
        success: totalSpells > 0,
        totalSpells,
        errors: allErrors
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

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async downloadDataDragonSpells(version: string): Promise<{
    success: boolean;
    totalSpells: number;
    errors: string[];
  }> {
    const cacheCheck = await this.checkCacheCompleteness();
    const missingSpellKeys = cacheCheck.missingSpells;
    const totalExpected = cacheCheck.totalExpected;
    const allSpellKeys = cacheCheck.allSpellKeys;
    const errors: string[] = [];

    const validCompletedSet = new Set<string>();

    for (const spellKey of allSpellKeys) {
      if (!missingSpellKeys.includes(spellKey)) {
        validCompletedSet.add(spellKey);
      }
    }

    const ASSETS_PER_SPELL = 2;

    if (missingSpellKeys.length === 0) {
      return { success: true, totalSpells: totalExpected, errors: [] };
    }

    console.log(`Downloading ${missingSpellKeys.length} DataDragon spells in parallel...`);

    this.updateProgress({
      current: Math.min(validCompletedSet.size, totalExpected) * ASSETS_PER_SPELL,
      total: totalExpected * ASSETS_PER_SPELL,
      itemName: "DataDragon summoner-spells",
      stage: "downloading",
      assetType: "spell-data",
      currentAsset: `${validCompletedSet.size}/${totalExpected}`
    });

    let downloadedCount = 0;

    // Download spells in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 8;
    const chunks = this.chunkArray(missingSpellKeys, CONCURRENCY_LIMIT);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex]!;

      const promises = chunk.map(async (spellKey) => {
        try {
          await this.downloadSummonerSpellData(spellKey, version);
          validCompletedSet.add(spellKey);
          downloadedCount++;
          return { success: true, spellKey };
        } catch (error) {
          const errorMsg = `Failed to download ${spellKey}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          downloadedCount++;
          return { success: false, spellKey, error: errorMsg };
        }
      });

      await Promise.all(promises);

      // Update progress after each batch
      await this.updateCategoryProgress(
        "summoner-spells",
        version,
        `batch_${chunkIndex + 1}`,
        totalExpected,
        Math.min(validCompletedSet.size, totalExpected),
        Array.from(validCompletedSet)
      );

      this.updateProgress({
        current: Math.min(validCompletedSet.size, totalExpected) * ASSETS_PER_SPELL,
        total: totalExpected * ASSETS_PER_SPELL,
        itemName: "DataDragon spells",
        stage: "downloading",
        assetType: "spell-data",
        currentAsset: `Batch ${chunkIndex + 1}/${chunks.length} (${validCompletedSet.size}/${totalExpected})`
      });
    }

    return {
      success: downloadedCount > 0,
      totalSpells: totalExpected,
      errors
    };
  }

  private async downloadCommunityDragonSpells(version: string): Promise<{
    success: boolean;
    totalSpells: number;
    errors: string[];
  }> {
    try {
      const communitySpells = await CommunityDragonSpellsService.getAvailableSpells(version);
      const totalSpells = communitySpells.length;
      const errors: string[] = [];
      let downloadedCount = 0;
      const completedSpells: string[] = [];

      console.log(`Downloading ${totalSpells} CommunityDragon spells in parallel...`);

      this.updateProgress({
        current: 0,
        total: totalSpells,
        itemName: "CommunityDragon spells",
        stage: "downloading",
        assetType: "spell-data",
        currentAsset: "Starting CommunityDragon spells download"
      });

      // Download spells in parallel with concurrency limit
      const CONCURRENCY_LIMIT = 6; // Slightly lower for external API
      const chunks = this.chunkArray(communitySpells, CONCURRENCY_LIMIT);

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex]!;

        const promises = chunk.map(async (spell) => {
          try {
            const imagePath = await CommunityDragonSpellsService.downloadSpellImage(spell, version);
            const success = await this.downloadCommunityDragonImage(spell.url, imagePath);

            if (success) {
              downloadedCount++;
              completedSpells.push(spell.filename);
              return { success: true, spell: spell.filename };
            } else {
              const errorMsg = `Failed to download CommunityDragon spell: ${spell.filename}`;
              console.error(errorMsg);
              errors.push(errorMsg);
              return { success: false, spell: spell.filename, error: errorMsg };
            }
          } catch (error) {
            const errorMsg = `Failed to download CommunityDragon spell ${spell.filename}: ${error}`;
            console.error(errorMsg);
            errors.push(errorMsg);
            return { success: false, spell: spell.filename, error: errorMsg };
          }
        });

        await Promise.all(promises);

        // Update progress after each batch
        await this.updateCategoryProgress(
          "community-dragon-spells",
          version,
          `batch_${chunkIndex + 1}`,
          totalSpells,
          completedSpells.length,
          completedSpells
        );

        this.updateProgress({
          current: completedSpells.length,
          total: totalSpells,
          itemName: "CommunityDragon spells",
          stage: "downloading",
          assetType: "spell-data",
          currentAsset: `Batch ${chunkIndex + 1}/${chunks.length} (${completedSpells.length}/${totalSpells})`
        });
      }

      return {
        success: downloadedCount > 0,
        totalSpells: downloadedCount,
        errors
      };
    } catch (error) {
      console.error("Failed to download CommunityDragon spells:", error);
      return {
        success: false,
        totalSpells: 0,
        errors: [`Failed to download CommunityDragon spells: ${error}`]
      };
    }
  }

  private async downloadCommunityDragonImage(url: string, destPath: string): Promise<boolean> {
    if (typeof window === "undefined" || !window.electronAPI) {
      return false;
    }

    try {
      // Try the standard downloadAsset method
      const result = await window.electronAPI.downloadAsset(url, "assets", destPath);

      if (result.success) {
        return true;
      } else {
        console.error(`Download failed for ${url}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`Exception downloading CommunityDragon image from ${url}:`, error);
      return false;
    }
  }

  private async cleanupManifestAfterSuccess(): Promise<void> {
    try {
      if (typeof window === "undefined" || !window.electronAPI) {
        return;
      }

      const version = await this.getLatestVersion();
      await this.updateCategoryProgress("summoner-spells", version, "cleanup", this.version ? 1 : 0, 1, []);
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
