import { getChampions } from "@lib/champions";
import { getLatestVersion } from "@lib/services/common/unified-asset-cache";
import { getAllRoleIconAssets, getDefaultAsset } from "@libLeagueClient/components/common";

export interface ChampSelectAssets {
  banPlaceholder: string;
  roleIcons: Record<string, string>;
  championsLoaded: boolean;
}

export interface ChampSelectSessionManager {
  assets: ChampSelectAssets;
  loadAssets(): Promise<void>;
  isAssetsLoaded(): boolean;
}

class ChampSelectService implements ChampSelectSessionManager {
  public assets: ChampSelectAssets = {
    banPlaceholder: "",
    roleIcons: {},
    championsLoaded: false
  };

  private assetsLoaded = false;

  public async loadAssets(): Promise<void> {
    try {
      // Load champions data
      await getChampions();
      this.assets.championsLoaded = true;

      // Get latest version and load assets
      const version = await getLatestVersion();
      this.assets.banPlaceholder = getDefaultAsset(version, "default_ban_placeholder.svg");
      this.assets.roleIcons = getAllRoleIconAssets(version);

      this.assetsLoaded = true;
    } catch (error) {
      console.error("Failed to load ChampSelect assets:", error);
      throw error;
    }
  }

  public isAssetsLoaded(): boolean {
    return this.assetsLoaded;
  }

  public getAssets(): ChampSelectAssets {
    return this.assets;
  }

  public reset(): void {
    this.assetsLoaded = false;
    this.assets = {
      banPlaceholder: "",
      roleIcons: {},
      championsLoaded: false
    };
  }
}

// Singleton instance
export const champSelectService = new ChampSelectService();
