import { Champion, ChampionSpell } from "../../types/game";
import { DDRAGON_CDN } from "@lib/services/common/constants";
import { BaseCacheService } from "@lib/services/assets/base";
import { DataDragonClient } from "@lib/services/external/DataDragon/client";
import path from "path";

interface DataDragonChampion {
  id: string;
  key: string;
  name: string;
  title: string;
  image: {
    full: string;
  };
  stats: {
    attackdamage: number;
    attackdamageperlevel: number;
    attackspeed: number;
    attackspeedperlevel: number;
    crit: number;
    critperlevel: number;
    hp: number;
    hpperlevel: number;
    hpregen: number;
    hpregenperlevel: number;
    movespeed: number;
    mp: number;
    mpperlevel: number;
    mpregen: number;
    mpregenperlevel: number;
    spellblock: number;
    spellblockperlevel: number;
  };
  spells: Array<{
    id: string;
    name: string;
    description: string;
    tooltip: string;
    image: {
      full: string;
    };
  }>;
  passive: {
    name: string;
    description: string;
    image: {
      full: string;
    };
  };
}

interface DataDragonResponse {
  data: { [key: string]: DataDragonChampion };
}

interface ChampionCacheData {
  id: number;
  alias: string;
  name: string;
  attackSpeed: number;
  splashCenteredImg: string;
  splashImg: string;
  loadingImg: string;
  squareImg: string;
  spells: ChampionSpell[];
}

// Using DownloadProgress from base-cache.ts

class ChampionCacheService extends BaseCacheService<Champion> {
  private isMainDownloadRunning = false;

  // Abstract method implementations
  async getAll(): Promise<Champion[]> {
    return this.getAllChampions(this.isMainDownloadRunning);
  }

  async getById(key: string): Promise<Champion | null> {
    return this.getChampionByKey(key);
  }

  async downloadChampionData(championKey: string, version: string): Promise<ChampionCacheData> {
    await this.initialize();

    if (typeof window === "undefined" || !window.electronAPI) {
      throw new Error("Electron API not available");
    }

    // Check if champion is already cached
    const dataKey = `champion-${version}-${championKey}-data`;

    // Check if file exists using asset manifest
    const manifestResult = await window.electronAPI.loadCategoryManifest("champions");
    if (manifestResult.success && manifestResult.data) {
      const manifest = manifestResult.data;
      if (manifest[dataKey]) {
        // Load cached data
        const loadResult = await window.electronAPI.loadCategoryManifest("champions");
        if (loadResult.success && loadResult.data) {
          const cachedData = loadResult.data[dataKey];
          if (cachedData) {
            return JSON.parse(cachedData.path); // Assuming path contains the data
          }
        }
      }
    }

    // Download champion data from DataDragon
    const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/champion/${championKey}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch champion data for ${championKey}: ${response.status}`);
    }

    const championData: { data: { [key: string]: DataDragonChampion } } = await response.json();
    const champion = championData.data[championKey];

    // Create champion directory structure using the correct path format
    const championDir = `${version}/champions/${championKey}`;

    // Download champion images
    const images = await this.downloadChampionImages(championKey, version, championDir);

    // Download ability images
    const spells = await this.downloadAbilityImages(champion, version, championDir);

    // Create comprehensive champion data
    const cacheData: ChampionCacheData = {
      id: parseInt(champion.key),
      alias: champion.id,
      name: champion.name,
      attackSpeed: champion.stats.attackspeed,
      splashCenteredImg: images.splashCentered,
      splashImg: images.splash,
      loadingImg: images.loading,
      squareImg: images.square,
      spells
    };

    // Don't save individual champion data to manifest - rely on category manifest system
    // Individual champion data is already tracked in the category progress

    return cacheData;
  }

  private async downloadChampionImages(
    championKey: string,
    version: string,
    championDir: string
  ): Promise<{
    splashCentered: string;
    splash: string;
    loading: string;
    square: string;
  }> {
    if (typeof window === "undefined" || !window.electronAPI) {
      throw new Error("Electron API not available");
    }

    // Define image URLs - using only the ones that work with current DataDragon
    const imageUrls = {
      square: `${DDRAGON_CDN}/${version}/img/champion/${championKey}.png`,
      splash: `${DDRAGON_CDN}/img/champion/splash/${championKey}_0.jpg`,
      splashCentered: `${DDRAGON_CDN}/img/champion/centered/${championKey}_0.jpg`,
      loading: `${DDRAGON_CDN}/img/champion/loading/${championKey}_0.jpg`
    };

    const downloadedImages: { [key: string]: string } = {};

    // Create array of download promises for parallel execution
    const downloadPromises = Object.entries(imageUrls).map(async ([key, url]) => {
      // Use standardized filenames instead of champion-specific names
      let fileName: string;
      if (key === "square") {
        fileName = "square.png";
      } else if (key === "splash") {
        fileName = "splash.jpg";
      } else if (key === "splashCentered") {
        fileName = "splashCentered.jpg";
      } else if (key === "loading") {
        fileName = "loading.jpg";
      } else {
        fileName = url.split("/").pop()!;
      }

      // Use the correct directory structure for asset keys
      const assetKey = `${championDir}/${fileName}`;

      try {
        if (typeof window !== "undefined" && window.electronAPI) {
          // Check if file already exists by checking the actual file path
          const fullPath = path.join(this.cacheDir, assetKey);
          const result = await window.electronAPI.checkFileExists(fullPath);

          if (result.success && result.exists === true) {
            // File already exists, use cached path
            downloadedImages[key] = `assets/${assetKey}`;
            return;
          }

          const downloadResult = await window.electronAPI.downloadAsset(url, "assets", assetKey);
          if (downloadResult.success) {
            // Return the relative path that matches the desired structure
            downloadedImages[key] = `assets/${assetKey}`;
          } else {
            // For splashCentered and loading, fallback to regular splash
            if (key === "splashCentered" || key === "loading") {
              const fallbackUrl = imageUrls.splash;
              const fallbackResult = await window.electronAPI.downloadAsset(fallbackUrl, "direct", assetKey);
              if (fallbackResult.success) {
                downloadedImages[key] = `assets/${assetKey}`;
              } else {
                console.warn(
                  `Failed to download ${key} image for ${championKey} (including fallback):`,
                  downloadResult.error
                );
                downloadedImages[key] = fallbackUrl; // Use fallback URL
              }
            } else {
              console.warn(`Failed to download ${key} image for ${championKey}:`, downloadResult.error);
              downloadedImages[key] = url; // Fallback to original URL
            }
          }
        }
      } catch (_error) {
        console.warn(`Error downloading ${key} image for ${championKey}:`, _error);
        // For splashCentered and loading, fallback to regular splash
        if (key === "splashCentered" || key === "loading") {
          downloadedImages[key] = imageUrls.splash;
        } else {
          downloadedImages[key] = url; // Fallback to original URL
        }
      }
    });

    // Wait for all downloads to complete
    await Promise.all(downloadPromises);

    return downloadedImages as {
      splashCentered: string;
      splash: string;
      loading: string;
      square: string;
    };
  }

  private async downloadAbilityImages(
    champion: DataDragonChampion,
    version: string,
    championDir: string
  ): Promise<ChampionSpell[]> {
    if (typeof window === "undefined" || !window.electronAPI) {
      throw new Error("Electron API not available");
    }

    const spells: ChampionSpell[] = [];
    const downloadPromises: Promise<void>[] = [];

    // Download regular spells with multiple states
    for (let i = 0; i < champion.spells.length; i++) {
      const spell = champion.spells[i];
      const abilityKey = this.getAbilityKey(i); // Q, W, E, R

      // Download base spell image
      const baseImageUrl = `${DDRAGON_CDN}/${version}/img/spell/${spell.image.full}`;
      const baseFileName = `${champion.id.toLowerCase()}_${abilityKey.toLowerCase()}.png`;
      const baseAssetKey = `${championDir}/abilities/${baseFileName}`;

      downloadPromises.push(
        (async () => {
          if (typeof window !== "undefined" && window.electronAPI) {
            // Check if file already exists by checking the actual file path
            const fullPath = path.join(this.cacheDir, baseAssetKey);
            const result = await window.electronAPI.checkFileExists(fullPath);

            if (result.success && result.exists === true) {
              // File already exists, use cached path
              spells.push({
                spellName: spell.id,
                iconAsset: `assets/${baseAssetKey}`,
                iconName: baseFileName
              });
              return;
            }

            const baseDownloadResult = await window.electronAPI.downloadAsset(baseImageUrl, "assets", baseAssetKey);
            if (baseDownloadResult.success) {
              spells.push({
                spellName: spell.id,
                iconAsset: `assets/${baseAssetKey}`,
                iconName: baseFileName
              });
            } else {
              console.warn(`Failed to download base spell image for ${spell.id}:`, baseDownloadResult.error);
              spells.push({
                spellName: spell.id,
                iconAsset: baseImageUrl,
                iconName: baseFileName
              });
            }
          }
        })()
      );

      // Download additional spell states for champions with recast abilities
      const recastSpells = this.getRecastSpellVariants(champion.id, spell.id);
      for (const recastSpell of recastSpells) {
        const recastImageUrl = `${DDRAGON_CDN}/${version}/img/spell/${recastSpell.imageName}`;
        const recastFileName = `${champion.id.toLowerCase()}_${abilityKey.toLowerCase()}_${recastSpell.suffix.toLowerCase()}.png`;
        const recastAssetKey = `${championDir}/abilities/${recastFileName}`;

        downloadPromises.push(
          (async () => {
            if (typeof window !== "undefined" && window.electronAPI) {
              // Check if file already exists by checking the actual file path
              const fullPath = path.join(this.cacheDir, recastAssetKey);
              const result = await window.electronAPI.checkFileExists(fullPath);

              if (result.success && result.exists === true) {
                // File already exists, use cached path
                spells.push({
                  spellName: `${spell.id}_${recastSpell.suffix}`,
                  iconAsset: `assets/${recastAssetKey}`,
                  iconName: recastFileName,
                  isRecast: true,
                  baseSpell: spell.id
                });
                return;
              }

              const recastDownloadResult = await window.electronAPI.downloadAsset(
                recastImageUrl,
                "assets",
                recastAssetKey
              );
              if (recastDownloadResult.success) {
                spells.push({
                  spellName: `${spell.id}_${recastSpell.suffix}`,
                  iconAsset: `assets/${recastAssetKey}`,
                  iconName: recastFileName,
                  isRecast: true,
                  baseSpell: spell.id
                });
              } else {
                console.warn(
                  `Failed to download recast spell image for ${spell.id}_${recastSpell.suffix}:`,
                  recastDownloadResult.error
                );
                spells.push({
                  spellName: `${spell.id}_${recastSpell.suffix}`,
                  iconAsset: recastImageUrl,
                  iconName: recastFileName,
                  isRecast: true,
                  baseSpell: spell.id
                });
              }
            }
          })()
        );
      }
    }

    // Download passive ability
    const passiveImageUrl = `${DDRAGON_CDN}/${version}/img/passive/${champion.passive.image.full}`;
    const passiveFileName = `${champion.id.toLowerCase()}_passive.png`;
    const passiveAssetKey = `${championDir}/abilities/${passiveFileName}`;

    downloadPromises.push(
      (async () => {
        if (typeof window !== "undefined" && window.electronAPI) {
          // Check if file already exists by checking the actual file path
          const fullPath = path.join(this.cacheDir, passiveAssetKey);
          const result = await window.electronAPI.checkFileExists(fullPath);

          if (result.success && result.exists === true) {
            // File already exists, use cached path
            spells.push({
              spellName: `${champion.id}Passive`,
              iconAsset: `assets/${passiveAssetKey}`,
              iconName: passiveFileName,
              isPassive: true
            });
            return;
          }

          const passiveDownloadResult = await window.electronAPI.downloadAsset(
            passiveImageUrl,
            "assets",
            passiveAssetKey
          );
          if (passiveDownloadResult.success) {
            spells.push({
              spellName: `${champion.id}Passive`,
              iconAsset: `assets/${passiveAssetKey}`,
              iconName: passiveFileName,
              isPassive: true
            });
          } else {
            console.warn(`Failed to download passive image for ${champion.id}:`, passiveDownloadResult.error);
            spells.push({
              spellName: `${champion.id}Passive`,
              iconAsset: passiveImageUrl,
              iconName: passiveFileName,
              isPassive: true
            });
          }
        }
      })()
    );

    // Wait for all downloads to complete
    await Promise.all(downloadPromises);

    return spells;
  }

  private getAbilityKey(index: number): string {
    const abilityKeys = ["Q", "W", "E", "R"];
    return abilityKeys[index] || "Q";
  }

  private getRecastSpellVariants(championId: string, spellId: string): Array<{ suffix: string; imageName: string }> {
    const recastVariants: {
      [championId: string]: {
        [spellId: string]: Array<{ suffix: string; imageName: string }>;
      };
    } = {
      Aatrox: {
        TheDarkinBlade: [
          { suffix: "Q2", imageName: "AatroxQ2.png" },
          { suffix: "Q3", imageName: "AatroxQ3.png" }
        ]
      },
      Riven: {
        BladeoftheExile: [
          { suffix: "Q2", imageName: "RivenQ2.png" },
          { suffix: "Q3", imageName: "RivenQ3.png" }
        ]
      },
      Yasuo: {
        SteelTempest: [
          { suffix: "Q2", imageName: "YasuoQ2.png" },
          { suffix: "Q3", imageName: "YasuoQ3.png" }
        ]
      },
      Yone: {
        MortalSteel: [
          { suffix: "Q2", imageName: "YoneQ2.png" },
          { suffix: "Q3", imageName: "YoneQ3.png" }
        ]
      },
      Katarina: {
        BouncingBlade: [{ suffix: "Q2", imageName: "KatarinaQ2.png" }]
      },
      KhaZix: {
        TasteTheirFear: [{ suffix: "Q2", imageName: "KhazixQ2.png" }]
      },
      Kassadin: {
        NullSphere: [{ suffix: "Q2", imageName: "KassadinQ2.png" }]
      }
    };

    return recastVariants[championId]?.[spellId] || [];
  }

  async getAllChampions(suppressProgress = false): Promise<Champion[]> {
    await this.initialize();

    const version = await this.getLatestVersion();
    this.version = version;

    // Get list of all champions from DataDragon
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/champion.json`, {
        signal: controller.signal,
        headers: {
          "User-Agent": "League-Stream-Utils/1.0.0"
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch champions list: ${response.status}`);
      }

      const data: DataDragonResponse = await response.json();
      const championKeys = Object.keys(data.data);

      const champions: Champion[] = [];
      let currentIndex = 0;

      if (!suppressProgress) {
        this.updateProgress({
          current: 0,
          total: championKeys.length,
          itemName: "",
          stage: "champion-data"
        });
      }

      for (const championKey of championKeys) {
        try {
          currentIndex++;
          if (!suppressProgress) {
            this.updateProgress({
              current: currentIndex,
              total: championKeys.length,
              itemName: data.data[championKey].name,
              stage: "champion-data"
            });
          }

          const cacheData = await this.downloadChampionData(championKey, version);

          champions.push({
            _id: cacheData.id,
            name: cacheData.name,
            key: cacheData.alias,
            image: cacheData.squareImg,
            attackSpeed: cacheData.attackSpeed,
            splashCenteredImg: cacheData.splashCenteredImg,
            splashImg: cacheData.splashImg,
            loadingImg: cacheData.loadingImg,
            squareImg: cacheData.squareImg,
            spells: cacheData.spells
          });
        } catch (error) {
          console.error(`Failed to process champion ${championKey}:`, error);
          // Add basic champion data as fallback
          const basicChamp = data.data[championKey];
          champions.push({
            _id: parseInt(basicChamp.key),
            name: basicChamp.name,
            key: basicChamp.id,
            image: `${DDRAGON_CDN}/${version}/img/champion/${basicChamp.image.full}`
          });
        }
      }

      if (!suppressProgress) {
        this.updateProgress({
          current: championKeys.length,
          total: championKeys.length,
          itemName: "",
          stage: "complete"
        });
      }

      return champions;
    } catch (error) {
      console.error("Failed to fetch champions list:", error);
      // Return empty array as fallback
      return [];
    }
  }

  async getChampionByKey(key: string): Promise<Champion | null> {
    await this.initialize();

    const version = await this.getLatestVersion();

    try {
      const cacheData = await this.downloadChampionData(key, version);

      return {
        _id: cacheData.id,
        name: cacheData.name,
        key: cacheData.alias,
        image: cacheData.squareImg,
        attackSpeed: cacheData.attackSpeed,
        splashCenteredImg: cacheData.splashCenteredImg,
        splashImg: cacheData.splashImg,
        loadingImg: cacheData.loadingImg,
        squareImg: cacheData.squareImg,
        spells: cacheData.spells
      };
    } catch (error) {
      console.error(`Failed to get champion ${key}:`, error);
      return null;
    }
  }

  private async cleanupManifestAfterSuccess(): Promise<void> {
    try {
      if (typeof window === "undefined" || !window.electronAPI) {
        console.log("Electron API not available, skipping manifest cleanup");
        return;
      }

      // No need to clear legacy manifest - using category manifest system now
      console.log("Champion download completed successfully.");
    } catch (error) {
      console.error("Failed to cleanup manifest after successful download:", error);
    }
  }

  async clearCache(): Promise<void> {
    await this.initialize();
    if (typeof window === "undefined" || !window.electronAPI) {
      throw new Error("Electron API not available");
    }
    await window.electronAPI.clearAssetCache();
  }

  isCurrentlyDownloading(): boolean {
    return this.isMainDownloadRunning;
  }

  async getCacheStats(): Promise<{
    totalItems: number;
    totalChampions: number;
    cacheSize: number;
    version: string;
  }> {
    await this.initialize();
    if (typeof window === "undefined" || !window.electronAPI) {
      throw new Error("Electron API not available");
    }
    const statsResult = await window.electronAPI.getAssetCacheStats();
    const count = statsResult.stats?.fileCount || 0;
    return {
      totalItems: count,
      totalChampions: count,
      cacheSize: statsResult.stats?.totalSize || 0,
      version: this.version
    };
  }

  async checkCacheCompleteness(): Promise<{
    isComplete: boolean;
    missingChampions: string[];
    totalExpected: number;
    allChampionKeys: string[];
  }> {
    await this.initialize();

    if (typeof window === "undefined" || !window.electronAPI) {
      return { isComplete: true, missingChampions: [], totalExpected: 0, allChampionKeys: [] };
    }

    try {
      const version = await DataDragonClient.getLatestVersion();
      this.version = version;

      // Get list of all champions using DataDragon client
      const championsResponse = await DataDragonClient.getChampions(version);
      const allChampionKeys = Object.keys(championsResponse.data);
      const totalExpected = allChampionKeys.length;

      // Simplified: directly check if champion files exist on disk
      const missingChampions: string[] = [];

      for (const championKey of allChampionKeys) {
        // Check if the main champion square image exists
        const squareImagePath = `${version}/champions/${championKey}/square.png`;

        let championExists = false;
        if (typeof window !== "undefined" && window.electronAPI) {
          const fullPath = `${this.cacheDir}/${squareImagePath}`;
          const fileCheck = await window.electronAPI.checkFileExists(fullPath);
          championExists = fileCheck.success && fileCheck.exists === true;
        }

        if (!championExists) {
          missingChampions.push(championKey);
        }
      }

      console.log(
        `Found ${allChampionKeys.length - missingChampions.length} existing champions, ${missingChampions.length} missing out of ${allChampionKeys.length} total`
      );

      return {
        isComplete: missingChampions.length === 0,
        missingChampions,
        totalExpected,
        allChampionKeys
      };
    } catch (error) {
      console.error("Failed to check cache completeness:", error);
      return {
        isComplete: false,
        missingChampions: [],
        totalExpected: 0,
        allChampionKeys: []
      };
    }
  }

  async downloadAllChampionsOnStartup(): Promise<{
    success: boolean;
    totalChampions: number;
    errors: string[];
  }> {
    await this.initialize();

    if (typeof window === "undefined" || !window.electronAPI) {
      return {
        success: false,
        totalChampions: 0,
        errors: ["Electron API not available"]
      };
    }

    try {
      // Set flag to suppress internal progress updates
      this.isMainDownloadRunning = true;
      const version = await this.getLatestVersion();
      this.version = version;

      // Check which champions are missing using category progress
      const cacheCheck = await this.checkCacheCompleteness();
      const missingChampionKeys = cacheCheck.missingChampions;
      const totalChampions = missingChampionKeys.length;
      const totalExpected = cacheCheck.totalExpected;
      const allChampionKeys = cacheCheck.allChampionKeys; // Reuse data from cache check
      const errors: string[] = [];

      // Build validCompletedSet from actual champions that are complete on disk (not from category progress which might have bad data)
      const validCompletedSet = new Set<string>();

      // Find which champions are actually complete by checking which ones are NOT missing
      for (const championKey of allChampionKeys) {
        if (!missingChampionKeys.includes(championKey)) {
          validCompletedSet.add(championKey);
        }
      }

      console.log(
        `Found ${validCompletedSet.size} champions already completed on disk out of ${allChampionKeys.length} total`
      );

      const ASSETS_PER_CHAMPION = 9;

      if (totalChampions === 0) {
        console.log("All champions are already cached!");

        // Report completion with asset count to match bootstrapper expectations
        const totalAssets = totalExpected * ASSETS_PER_CHAMPION;
        this.updateProgress({
          current: totalAssets,
          total: totalAssets,
          itemName: `All ${totalExpected} champions already cached`,
          stage: "complete",
          assetType: "champion",
          currentAsset: "Champions downloaded successfully"
        });

        return { success: true, totalChampions: totalExpected, errors: [] };
      }

      console.log(`Found ${totalChampions} missing champions to download`);

      // Initial progress reflecting already cached champions
      this.updateProgress({
        current: Math.min(validCompletedSet.size, totalExpected) * ASSETS_PER_CHAMPION,
        total: totalExpected * ASSETS_PER_CHAMPION,
        itemName: "champions",
        stage: "downloading",
        assetType: "champion",
        currentAsset: `${validCompletedSet.size}/${totalExpected}`
      });

      // Download champions one by one for better progress tracking
      let downloadedCount = 0;

      for (const championKey of missingChampionKeys) {
        try {
          await this.downloadChampionData(championKey, version);
          downloadedCount++;

          // Add to completed items (unique)
          validCompletedSet.add(championKey);

          // Update category progress manifest
          await this.updateCategoryProgress(
            "champions",
            version,
            championKey,
            totalExpected,
            Math.min(validCompletedSet.size, totalExpected),
            Array.from(validCompletedSet)
          );

          this.updateProgress({
            current: Math.min(validCompletedSet.size, totalExpected) * ASSETS_PER_CHAMPION,
            total: totalExpected * ASSETS_PER_CHAMPION,
            itemName: championKey,
            stage: "downloading",
            assetType: "champion",
            currentAsset: championKey
          });
        } catch (error) {
          const errorMsg = `Failed to download ${championKey}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);

          // Increment count even if download failed to keep progress consistent
          downloadedCount++;

          this.updateProgress({
            current: Math.min(validCompletedSet.size, totalExpected) * ASSETS_PER_CHAMPION,
            total: totalExpected * ASSETS_PER_CHAMPION,
            itemName: championKey,
            stage: "downloading",
            assetType: "champion",
            currentAsset: championKey
          });
        }

        // Small delay between champions to be nice to the API
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Final progress update - report completion with asset-aligned totals
      this.updateProgress({
        current: totalExpected * ASSETS_PER_CHAMPION,
        total: totalExpected * ASSETS_PER_CHAMPION,
        itemName: `All ${totalExpected} champions complete`,
        stage: "complete",
        assetType: "champion",
        currentAsset: "Champions downloaded successfully"
      });

      // Clean up manifests after successful completion
      if (downloadedCount > 0) {
        console.log("All champions downloaded successfully");
        await this.cleanupManifestAfterSuccess();
      }

      return {
        success: downloadedCount > 0,
        totalChampions: downloadedCount,
        errors
      };
    } catch (error) {
      console.error("Failed to download champions:", error);
      return {
        success: false,
        totalChampions: 0,
        errors: [`Failed to download champions: ${error}`]
      };
    } finally {
      // Reset flag to allow normal progress updates
      this.isMainDownloadRunning = false;
    }
  }
}

export const championCacheService = new ChampionCacheService();
