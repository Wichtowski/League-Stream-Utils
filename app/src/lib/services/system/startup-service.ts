import { championCacheService } from "@lib/services/assets";
import { summonerSpellCacheService } from "@lib/services/assets/summoner-spell";

interface StartupProgress {
  stage: "checking" | "downloading" | "complete" | "error";
  message: string;
  progress?: number;
  total?: number;
}

class StartupService {
  private isInitialized = false;
  private downloadInProgress = false;

  async initializeChampionCache(): Promise<{
    success: boolean;
    message: string;
  }> {
    if (this.isInitialized || this.downloadInProgress) {
      return {
        success: true,
        message: "Already initialized or download in progress"
      };
    }

    // Only run in Electron environment
    if (typeof window === "undefined" || !window.electronAPI) {
      return {
        success: true,
        message: "Not in Electron environment, skipping cache initialization"
      };
    }

    try {
      this.downloadInProgress = true;
      console.log("Starting champion cache initialization...");

      // Check if cache is complete
      const completeness = await championCacheService.checkCacheCompleteness();

      if (completeness.isComplete) {
        console.log("Champion cache is complete, no download needed");
        this.isInitialized = true;
        this.downloadInProgress = false;
        return { success: true, message: "Champion cache is already complete" };
      }

      console.log(`Cache incomplete. Missing ${completeness.missingChampions.length} champions. Starting download...`);

      // Download missing champions
      const result = await championCacheService.downloadAllChampionsOnStartup();

      this.isInitialized = true;
      this.downloadInProgress = false;

      if (result.success) {
        return {
          success: true,
          message: `Successfully downloaded ${result.totalChampions} champions`
        };
      } else {
        return {
          success: false,
          message: `Download completed with errors. ${result.errors.length} champions failed to download.`
        };
      }
    } catch (error) {
      this.downloadInProgress = false;
      console.error("Failed to initialize champion cache:", error);
      return {
        success: false,
        message: `Failed to initialize champion cache: ${error}`
      };
    }
  }

  async initializeChampionCacheWithProgress(
    onProgress?: (progress: StartupProgress) => void
  ): Promise<{ success: boolean; message: string }> {
    if (this.isInitialized || this.downloadInProgress) {
      return {
        success: true,
        message: "Already initialized or download in progress"
      };
    }

    // Only run in Electron environment
    if (typeof window === "undefined" || !window.electronAPI) {
      return {
        success: true,
        message: "Not in Electron environment, skipping cache initialization"
      };
    }

    try {
      this.downloadInProgress = true;

      onProgress?.({
        stage: "checking",
        message: "Checking champion cache status..."
      });

      // Check if cache is complete
      const completeness = await championCacheService.checkCacheCompleteness();

      if (completeness.isComplete) {
        onProgress?.({
          stage: "complete",
          message: "Champion cache is already complete"
        });
        this.isInitialized = true;
        this.downloadInProgress = false;
        return { success: true, message: "Champion cache is already complete" };
      }

      onProgress?.({
        stage: "downloading",
        message: `Downloading ${completeness.missingChampions.length} missing champions...`,
        progress: 0,
        total: completeness.missingChampions.length
      });

      // Set up progress tracking from champion cache service
      championCacheService.onProgress((championProgress) => {
        // Use the currentAsset if available for more detailed progress
        const detailedMessage = championProgress.currentAsset
          ? `${championProgress.currentAsset}`
          : `Downloading ${championProgress.itemName} (${championProgress.current}/${championProgress.total})`;

        onProgress?.({
          stage: "downloading",
          message: detailedMessage,
          progress: championProgress.current,
          total: championProgress.total
        });
      });

      // Download missing champions using the champion cache service
      const result = await championCacheService.downloadAllChampionsOnStartup();

      this.isInitialized = true;
      this.downloadInProgress = false;

      onProgress?.({
        stage: "complete",
        message: `Download completed. ${result.totalChampions} champions downloaded successfully.`
      });

      if (result.errors.length > 0) {
        return {
          success: false,
          message: `Download completed with ${result.errors.length} errors. ${result.totalChampions} champions downloaded successfully.`
        };
      }

      return {
        success: true,
        message: `Successfully downloaded ${result.totalChampions} champions`
      };
    } catch (error) {
      this.downloadInProgress = false;
      console.error("Failed to initialize champion cache:", error);

      onProgress?.({
        stage: "error",
        message: `Failed to initialize champion cache: ${error}`
      });

      return {
        success: false,
        message: `Failed to initialize champion cache: ${error}`
      };
    }
  }

  getInitializedStatus(): boolean {
    return this.isInitialized;
  }

  isDownloadInProgress(): boolean {
    return this.downloadInProgress;
  }

  async checkAllAssetsCompleteness(): Promise<{
    isComplete: boolean;
    missingAssets: {
      champions: number;
      spells: number;
      total: number;
    };
    message: string;
  }> {
    if (this.isInitialized || this.downloadInProgress) {
      return {
        isComplete: true,
        missingAssets: { champions: 0, spells: 0, total: 0 },
        message: "Already initialized or download in progress"
      };
    }

    // Only run in Electron environment
    if (typeof window === "undefined" || !window.electronAPI) {
      return {
        isComplete: true,
        missingAssets: { champions: 0, spells: 0, total: 0 },
        message: "Not in Electron environment, skipping asset check"
      };
    }

    try {
      console.log("Checking all assets completeness...");

      // Check champions
      const championCompleteness = await championCacheService.checkCacheCompleteness();
      console.log(`Champions: ${championCompleteness.isComplete ? 'complete' : `missing ${championCompleteness.missingChampions.length}`}`);

      // Check all summoner spells (DataDragon + CommunityDragon)
      const spellCompleteness = await summonerSpellCacheService.checkCacheCompleteness();
      const communityDragonCompleteness = await summonerSpellCacheService.checkCommunityDragonSpellsCompleteness();
      
      const missingDataDragonSpells = spellCompleteness.missingSpells.length;
      const missingCommunityDragonSpells = communityDragonCompleteness.missingSpells.length;
      const totalMissingSpells = missingDataDragonSpells + missingCommunityDragonSpells;
      
      console.log(`Spells: ${totalMissingSpells === 0 ? 'complete' : `missing ${totalMissingSpells} (${missingDataDragonSpells} DataDragon, ${missingCommunityDragonSpells} CommunityDragon)`}`);

      const missingChampions = championCompleteness.isComplete ? 0 : championCompleteness.missingChampions.length;
      const totalMissing = missingChampions + totalMissingSpells;

      const isComplete = totalMissing === 0;

      if (isComplete) {
        this.isInitialized = true;
        return {
          isComplete: true,
          missingAssets: { champions: 0, spells: 0, total: 0 },
          message: "All assets are complete"
        };
      } else {
        return {
          isComplete: false,
          missingAssets: {
            champions: missingChampions,
            spells: totalMissingSpells,
            total: totalMissing
          },
          message: `Missing ${totalMissing} assets (${missingChampions} champions, ${totalMissingSpells} spells)`
        };
      }
    } catch (error) {
      console.error("Failed to check assets completeness:", error);
      return {
        isComplete: false,
        missingAssets: { champions: 0, spells: 0, total: 0 },
        message: `Failed to check assets: ${error}`
      };
    }
  }

  reset(): void {
    this.isInitialized = false;
    this.downloadInProgress = false;
  }
}

export const startupService = new StartupService();
