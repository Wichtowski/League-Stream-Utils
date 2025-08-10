export interface AssetValidationResult {
  isValid: boolean;
  exists: boolean;
  sizeMatch: boolean;
  error?: string;
}

export interface AssetValidationOptions {
  checkSize?: boolean;
  checkAge?: boolean;
  maxAge?: number; // in milliseconds
}

/**
 * Centralized asset validation service to eliminate duplicate validation logic
 */
export class AssetValidator {
  /**
   * Check if a file exists on disk
   */
  static async checkFileExists(filePath: string): Promise<boolean> {
    if (typeof window === "undefined" || !window.electronAPI) {
      return false;
    }

    try {
      const result = await window.electronAPI.checkFileExists(filePath);
      return result.success && result.exists === true;
    } catch (error) {
      console.error("Error checking file existence:", error);
      return false;
    }
  }

  /**
   * Get file size
   */
  static async getFileSize(filePath: string): Promise<number | null> {
    if (typeof window === "undefined" || !window.electronAPI) {
      return null;
    }

    try {
      const result = await window.electronAPI.getFileSize(filePath);
      return result.success ? result.size || null : null;
    } catch (error) {
      console.error("Error getting file size:", error);
      return null;
    }
  }

  /**
   * Validate an asset based on manifest entry
   */
  static async validateAsset(
    manifestEntry: {
      path: string;
      size?: number;
      timestamp?: number;
    },
    options: AssetValidationOptions = {}
  ): Promise<AssetValidationResult> {
    const { checkSize = true, checkAge = false, maxAge = 30 * 24 * 60 * 60 * 1000 } = options;

    try {
      // Check if file exists
      const exists = await this.checkFileExists(manifestEntry.path);
      if (!exists) {
        return {
          isValid: false,
          exists: false,
          sizeMatch: false,
          error: "File does not exist"
        };
      }

      let sizeMatch = true;
      if (checkSize && manifestEntry.size !== undefined) {
        const actualSize = await this.getFileSize(manifestEntry.path);
        sizeMatch = actualSize === manifestEntry.size;
      }

      // Check file age if requested
      if (checkAge && manifestEntry.timestamp) {
        const fileAge = Date.now() - manifestEntry.timestamp;
        if (fileAge > maxAge) {
          return {
            isValid: false,
            exists: true,
            sizeMatch,
            error: "File is too old"
          };
        }
      }

      return {
        isValid: sizeMatch,
        exists: true,
        sizeMatch,
        error: sizeMatch ? undefined : "File size mismatch"
      };
    } catch (error) {
      return {
        isValid: false,
        exists: false,
        sizeMatch: false,
        error: `Validation error: ${error}`
      };
    }
  }

  /**
   * Validate multiple assets in parallel
   */
  static async validateAssets(
    assets: Array<{
      key: string;
      manifestEntry: {
        path: string;
        size?: number;
        timestamp?: number;
      };
    }>,
    options: AssetValidationOptions = {}
  ): Promise<Record<string, AssetValidationResult>> {
    const validationPromises = assets.map(async (asset) => {
      const result = await this.validateAsset(asset.manifestEntry, options);
      return { key: asset.key, result };
    });

    const results = await Promise.all(validationPromises);

    return results.reduce(
      (acc, { key, result }) => {
        acc[key] = result;
        return acc;
      },
      {} as Record<string, AssetValidationResult>
    );
  }

  /**
   * Check if cached asset path follows the expected pattern
   */
  static validateAssetPath(assetKey: string, expectedPattern?: RegExp): boolean {
    if (!assetKey.startsWith("assets/")) {
      return false;
    }

    if (expectedPattern) {
      return expectedPattern.test(assetKey);
    }

    // Default pattern: assets/version/category/...
    const defaultPattern = /^assets\/[\d.]+\/(champions|items|overlay|runes)\/.*$/;
    return defaultPattern.test(assetKey);
  }

  /**
   * Generate asset key for specific asset types
   */
  static generateAssetKey(type: "champion" | "item" | "overlay" | "rune", version: string, ...parts: string[]): string {
    return `game/${version}/${type}s/${parts.join("/")}`;
  }

  /**
   * Generate cached asset path
   */
  static generateCachedPath(assetKey: string): string {
    return `assets/${assetKey}`;
  }

  /**
   * Extract version from asset key
   */
  static extractVersionFromAssetKey(assetKey: string): string | null {
    const match = assetKey.match(/game\/([\d.]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Extract asset type from asset key
   */
  static extractAssetType(assetKey: string): string | null {
    const match = assetKey.match(/game\/[\d.]+\/([^/]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Check if asset key represents a key file (used for quick validation)
   */
  static isKeyFile(assetKey: string): boolean {
    // Key files are files that if present, indicate the asset is properly downloaded
    return (
      assetKey.endsWith("/square.png") || // Champion square image
      assetKey.endsWith("/icon.png") || // Item icon
      assetKey.endsWith("/data.json") || // Data files
      assetKey.includes("/overlay/")
    ); // Game UI overlay files
  }
}
