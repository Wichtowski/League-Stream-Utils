import { BaseCacheService } from "@lib/services/assets/base";
import type { BlueprintDownloaderConfig } from "@lib/services/assets/base";

interface CommunityDragonRune {
  id: number;
  name: string;
  iconPath: string;
  shortDesc: string;
  longDesc: string;
  slot: number;
  key: string;
}

interface CommunityDragonRuneResponse {
  [key: string]: CommunityDragonRune;
}

export class RunesBlueprintDownloader extends BaseCacheService<CommunityDragonRuneResponse> {
  private readonly DDRAGON_CDN = "https://ddragon.leagueoflegends.com/cdn";

  protected config: BlueprintDownloaderConfig = {
    endpoint: "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perks.json",
    blueprintFileName: "runes-blueprint.json",
    assetType: "rune",
    basePath: "assets/"
  };

  async downloadBlueprint(): Promise<void> {
    await this.initialize();

    try {
      // Update progress - checking stage first
      this.updateProgress({
        current: 0,
        total: 1,
        itemName: "runes",
        stage: "checking",
        currentAsset: "Checking rune cache...",
        assetType: "rune-data"
      });

      // Update progress - fetching data
      this.updateProgress({
        current: 0,
        total: 1,
        itemName: "runes",
        stage: "downloading",
        currentAsset: "Fetching runes data...",
        assetType: "rune-data"
      });
      const data = await this.fetchJson<CommunityDragonRuneResponse>(this.config.endpoint);
      const allRunes = Object.values(data);

      // Filter out template runes from total count
      const validRunes = allRunes.filter(
        (rune) => rune.iconPath && rune.iconPath !== "/lol-game-data/assets/v1/perk-images/Template/7000.png"
      );
      const totalRunes = validRunes.length;

      console.log(
        `Found ${totalRunes} existing runes, ${validRunes.length - totalRunes} missing out of ${validRunes.length} total`
      );

      // Check category progress instead of individual file checks (use League version for runes too)
      const categoryProgress = await this.getCategoryProgress("runes", this.version);
      let completedRunes = categoryProgress.completedItems;

      // If no runes in manifest but files might exist, migrate them
      if (completedRunes.length === 0) {
        const existingRunes = await this.migrateExistingRunes(validRunes);
        if (existingRunes.length > 0) {
          completedRunes = existingRunes;
        }
      }

      const alreadyDownloaded = completedRunes.length;

      // Update progress - downloading icons
      this.updateProgress({
        current: alreadyDownloaded,
        total: totalRunes,
        itemName: "runes",
        stage: "downloading",
        currentAsset:
          alreadyDownloaded > 0 ? `Found ${alreadyDownloaded} runes already downloaded` : "Starting rune download...",
        assetType: "rune-images"
      });

      // Download rune icons using the filtered valid runes
      const downloadedCount = await this.downloadRuneIcons(validRunes, completedRunes);

      // Update progress - complete with actual count
      this.updateProgress({
        current: downloadedCount,
        total: totalRunes,
        itemName: "runes",
        stage: "complete",
        currentAsset: "Runes downloaded successfully",
        assetType: "rune-data"
      });
    } catch (error) {
      console.error(`Error downloading ${this.config.assetType} blueprint:`, error);

      // Update progress - error
      this.updateProgress({
        current: 0,
        total: 1,
        itemName: "runes",
        stage: "error",
        currentAsset: "Failed to download runes",
        assetType: "rune-data"
      });

      throw error;
    }
  }

  async downloadBlueprintForCurrentVersion(): Promise<void> {
    await this.downloadBlueprint();
  }

  private async migrateExistingRunes(validRunes: CommunityDragonRune[]): Promise<string[]> {
    const existingRunes: string[] = [];
    try {
      for (const rune of validRunes) {
        // Build the expected icon path for this rune
        let style = rune.key;
        const iconPath = rune.iconPath.replace("/lol-game-data/assets/v1/perk-images/", "");
        if (!style) {
          const pathParts = iconPath.split("/");
          style = pathParts.length > 0 ? pathParts[0] : "Unknown";
        }
        const iconFileName = iconPath.split("/").pop() || `${rune.name}.png`;
        const iconKey = `${this.version}/runes/${style}/${iconFileName}`;
        const fileExists = await this.checkFileExists(iconKey);
        if (fileExists) {
          existingRunes.push(rune.id.toString());
        }
      }
      if (existingRunes.length > 0) {
        await this.updateCategoryProgress(
          "runes",
          this.version,
          existingRunes[existingRunes.length - 1],
          validRunes.length,
          existingRunes.length,
          existingRunes
        );
      }
      return existingRunes;
    } catch (error) {
      console.error("Error during runes migration:", error);
      return [];
    }
  }

  private async downloadRuneIcons(validRunes: CommunityDragonRune[], completedRunes: string[]): Promise<number> {
    if (typeof window === "undefined" || !window.electronAPI) {
      throw new Error("Electron API not available");
    }

    const runeDir = `${this.version}/runes`;
    const totalRunes = validRunes.length;

    // Filter out runes that have already been downloaded
    const runesToDownload = validRunes.filter((rune) => !completedRunes.includes(rune.id.toString()));

    const alreadyDownloaded = completedRunes.length;
    let downloadedCount = alreadyDownloaded;
    const currentCompletedRunes = [...completedRunes];

    console.log(`Found ${alreadyDownloaded} runes already downloaded, ${runesToDownload.length} runes to download`);

    // If all runes are already downloaded, skip the download process
    if (runesToDownload.length === 0) {
      console.log("All rune icons already downloaded");
      return totalRunes;
    }

    for (const rune of runesToDownload) {
      try {
        // Convert icon path to DataDragon CDN URL
        const iconPath = rune.iconPath.replace("/lol-game-data/assets/v1/perk-images/", "");
        const iconUrl = `${this.DDRAGON_CDN}/img/perk-images/${iconPath}`;
        console.log(iconPath, "assets", iconUrl);
        // Styles/Sorcery/Unflinching/Unflinching.png
        // assets 
        // https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Resolve/Conditioning/Conditioning.png


        // Determine style (color) from rune.key (e.g., Domination, Precision, etc.)
        // If rune.key is undefined, try to extract from icon path or use a default
        let style = rune.key;
        if (!style) {
          // Try to extract style from icon path
          const pathParts = iconPath.split("/");
          if (pathParts.length > 0) {
            style = pathParts[0]; // Use first part of path as style
          } else {
            style = "Unknown"; // Fallback
          }
        }

        // Use the last part of the iconPath as the file name
        const iconFileName = iconPath.split("/").pop() || `${rune.name}.png`;
        const iconKey = `${runeDir}/${iconFileName}`;
        console.log(iconKey, "assets", iconKey);
        // Styles/RunesIcon.png assets https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/RunesIcon.png
        // Update progress for current rune
        this.updateProgress({
          current: downloadedCount,
          total: totalRunes,
          itemName: "runes",
          stage: "downloading",
          currentAsset: `Downloading ${rune.name}...`,
          assetType: "rune-images"
        });

        await this.downloadAsset(iconUrl, "assets", iconKey);
        downloadedCount++;
        currentCompletedRunes.push(rune.id.toString());

        // Update category progress
        await this.updateCategoryProgress(
          "runes",
          this.version,
          rune.id.toString(),
          totalRunes,
          downloadedCount,
          currentCompletedRunes
        );

        // Update progress after successful download
        this.updateProgress({
          current: downloadedCount,
          total: totalRunes,
          itemName: "runes",
          stage: "downloading",
          currentAsset: `Downloaded ${rune.name}`,
          assetType: "rune-images"
        });
      } catch (error) {
        console.error(`Failed to download rune icon for ${rune.name}:`, error);

        // Update progress even on error to show which rune failed
        this.updateProgress({
          current: downloadedCount,
          total: totalRunes,
          itemName: "runes",
          stage: "downloading",
          currentAsset: `Failed to download ${rune.name}`,
          assetType: "rune-images"
        });
      }
    }

    return downloadedCount;
  }

  async getAll(): Promise<CommunityDragonRuneResponse[]> {
    return [];
  }

  async getById(_id: string): Promise<CommunityDragonRuneResponse | null> {
    return null;
  }
}

export const runesBlueprintDownloader = new RunesBlueprintDownloader();
