import { AssetValidator } from "./validator";
import { DataDragonClient } from "../dataDragon/client";

export interface MigrationResult {
  migratedItems: string[];
  totalFound: number;
  errors: string[];
}

export interface MigrationOptions {
  targetVersion: string;
  versionsToCheck?: string[];
  maxVersionsToCheck?: number;
  updateCategoryManifest?: boolean;
}

/**
 * Centralized asset migration utility to eliminate duplicate migration logic
 */
export class AssetMigrator {
  /**
   * Default versions to check when migrating (recent versions)
   */
  private static readonly DEFAULT_VERSIONS_TO_CHECK = [
    "15.12.1",
    "15.11.1",
    "15.10.1",
    "15.9.1",
    "15.8.1",
    "15.7.1",
    "15.6.1",
    "15.5.1",
    "15.4.1",
    "15.3.1",
    "14.24.1",
    "14.23.1",
    "14.22.1",
    "14.21.1",
    "14.20.1",
  ];

  /**
   * Migrate existing champion assets to new version structure
   */
  static async migrateChampions(
    expectedChampionKeys: string[],
    options: MigrationOptions,
  ): Promise<MigrationResult> {
    const {
      targetVersion,
      versionsToCheck = this.DEFAULT_VERSIONS_TO_CHECK,
      maxVersionsToCheck = 5,
    } = options;
    const migratedItems: string[] = [];
    const errors: string[] = [];

    try {
      console.log(
        `Migrating existing champions for version ${targetVersion}...`,
      );

      // First, check if champions exist in the target version directory
      for (const championKey of expectedChampionKeys) {
        const squareImagePath = AssetValidator.generateCachedPath(
          AssetValidator.generateAssetKey(
            "champion",
            targetVersion,
            championKey,
            "square.png",
          ),
        );
        const fileExists =
          await AssetValidator.checkFileExists(squareImagePath);

        if (fileExists) {
          migratedItems.push(championKey);
        }
      }

      // If we found champions in the current version, we're done
      if (migratedItems.length > 0) {
        console.log(
          `Found ${migratedItems.length} champions in current version ${targetVersion}`,
        );
        return { migratedItems, totalFound: migratedItems.length, errors };
      }

      // Check previous versions for existing champions
      console.log(
        `No champions found in version ${targetVersion}, checking previous versions...`,
      );

      const versionsToCheckFiltered = versionsToCheck
        .filter((v) => v !== targetVersion)
        .slice(0, maxVersionsToCheck);

      for (const checkVersion of versionsToCheckFiltered) {
        let foundInThisVersion = 0;

        for (const championKey of expectedChampionKeys) {
          if (migratedItems.includes(championKey)) continue; // Skip already migrated

          const squareImagePath = AssetValidator.generateCachedPath(
            AssetValidator.generateAssetKey(
              "champion",
              checkVersion,
              championKey,
              "square.png",
            ),
          );
          const fileExists =
            await AssetValidator.checkFileExists(squareImagePath);

          if (fileExists) {
            migratedItems.push(championKey);
            foundInThisVersion++;
          }
        }

        if (foundInThisVersion > 0) {
          console.log(
            `Found ${foundInThisVersion} champions in version ${checkVersion}`,
          );

          // If we found a significant number of champions in this version,
          // it's likely the main version the user has
          if (foundInThisVersion > 50) {
            console.log(
              `Version ${checkVersion} appears to be the main version with ${foundInThisVersion} champions`,
            );
            break; // Stop checking further versions
          }
        }
      }

      return { migratedItems, totalFound: migratedItems.length, errors };
    } catch (error) {
      const errorMsg = `Error during champion migration: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      return { migratedItems, totalFound: migratedItems.length, errors };
    }
  }

  /**
   * Migrate existing item assets to new version structure
   */
  static async migrateItems(
    expectedItemKeys: string[],
    options: MigrationOptions,
  ): Promise<MigrationResult> {
    const {
      targetVersion,
      versionsToCheck = this.DEFAULT_VERSIONS_TO_CHECK,
      maxVersionsToCheck = 3,
    } = options;
    const migratedItems: string[] = [];
    const errors: string[] = [];

    try {
      console.log(`Migrating existing items for version ${targetVersion}...`);

      // Check if items exist in the target version directory
      for (const itemKey of expectedItemKeys) {
        const iconPath = AssetValidator.generateCachedPath(
          AssetValidator.generateAssetKey(
            "item",
            targetVersion,
            itemKey,
            "icon.png",
          ),
        );
        const fileExists = await AssetValidator.checkFileExists(iconPath);

        if (fileExists) {
          migratedItems.push(itemKey);
        }
      }

      // If no items found in current version, check previous versions
      if (migratedItems.length === 0) {
        console.log(
          `No items found in version ${targetVersion}, checking previous versions...`,
        );

        const versionsToCheckFiltered = versionsToCheck
          .filter((v) => v !== targetVersion)
          .slice(0, maxVersionsToCheck);

        for (const checkVersion of versionsToCheckFiltered) {
          let foundInThisVersion = 0;

          for (const itemKey of expectedItemKeys) {
            if (migratedItems.includes(itemKey)) continue;

            const iconPath = AssetValidator.generateCachedPath(
              AssetValidator.generateAssetKey(
                "item",
                checkVersion,
                itemKey,
                "icon.png",
              ),
            );
            const fileExists = await AssetValidator.checkFileExists(iconPath);

            if (fileExists) {
              migratedItems.push(itemKey);
              foundInThisVersion++;
            }
          }

          if (foundInThisVersion > 0) {
            console.log(
              `Found ${foundInThisVersion} items in version ${checkVersion}`,
            );

            // Items change less frequently, so finding any is good
            if (foundInThisVersion > 100) {
              break;
            }
          }
        }
      }

      return { migratedItems, totalFound: migratedItems.length, errors };
    } catch (error) {
      const errorMsg = `Error during item migration: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      return { migratedItems, totalFound: migratedItems.length, errors };
    }
  }

  /**
   * Migrate overlay assets (these typically don't change between versions)
   */
  static async migrateOverlayAssets(
    expectedAssets: string[],
    options: MigrationOptions,
  ): Promise<MigrationResult> {
    const { targetVersion } = options;
    const migratedItems: string[] = [];
    const errors: string[] = [];

    try {
      console.log(
        `Checking existing overlay assets for version ${targetVersion}...`,
      );

      for (const assetKey of expectedAssets) {
        const [category, filename] = assetKey.split("/");
        const filePath = AssetValidator.generateCachedPath(
          `game/${targetVersion}/overlay/${category}/${filename}`,
        );
        const fileExists = await AssetValidator.checkFileExists(filePath);

        if (fileExists) {
          migratedItems.push(assetKey);
        }
      }

      return { migratedItems, totalFound: migratedItems.length, errors };
    } catch (error) {
      const errorMsg = `Error during overlay asset migration: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      return { migratedItems, totalFound: migratedItems.length, errors };
    }
  }

  /**
   * Update category manifest with migrated items
   */
  static async updateCategoryManifest(
    category: string,
    migratedItems: string[],
    totalExpected: number,
    version: string,
    updateCategoryProgressFn: (
      category: string,
      version: string,
      lastItem: string,
      total: number,
      downloaded: number,
      completedItems: string[],
    ) => Promise<void>,
  ): Promise<void> {
    if (migratedItems.length === 0) return;

    try {
      await updateCategoryProgressFn(
        category,
        version,
        migratedItems[migratedItems.length - 1], // Last migrated item
        totalExpected,
        migratedItems.length,
        migratedItems,
      );

      console.log(
        `Successfully updated ${category} category manifest with ${migratedItems.length} migrated items`,
      );
    } catch (error) {
      console.error(`Failed to update ${category} category manifest:`, error);
    }
  }

  /**
   * Comprehensive migration for all asset types
   */
  static async migrateAllAssets(
    options: MigrationOptions & {
      updateCategoryProgressFn?: (
        category: string,
        version: string,
        lastItem: string,
        total: number,
        downloaded: number,
        completedItems: string[],
      ) => Promise<void>;
    },
  ): Promise<{
    champions: MigrationResult;
    items: MigrationResult;
    overlayAssets: MigrationResult;
    overall: {
      totalMigrated: number;
      totalErrors: number;
    };
  }> {
    const { targetVersion, updateCategoryProgressFn } = options;

    try {
      // Get expected items from DataDragon
      const [championsResponse, itemsResponse] = await Promise.all([
        DataDragonClient.getChampions(targetVersion),
        DataDragonClient.getItems(targetVersion),
      ]);

      const expectedChampions = Object.keys(championsResponse.data);
      const expectedItems = Object.keys(itemsResponse.data);

      // Define overlay assets
      const expectedOverlayAssets = [
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
        "baronpit/herald.png",
      ];

      // Run migrations in parallel
      const [champions, items, overlayAssets] = await Promise.all([
        this.migrateChampions(expectedChampions, options),
        this.migrateItems(expectedItems, options),
        this.migrateOverlayAssets(expectedOverlayAssets, options),
      ]);

      // Update category manifests if function provided
      if (updateCategoryProgressFn) {
        await Promise.all([
          champions.migratedItems.length > 0
            ? this.updateCategoryManifest(
                "champions",
                champions.migratedItems,
                expectedChampions.length,
                targetVersion,
                updateCategoryProgressFn,
              )
            : Promise.resolve(),
          items.migratedItems.length > 0
            ? this.updateCategoryManifest(
                "items",
                items.migratedItems,
                expectedItems.length,
                targetVersion,
                updateCategoryProgressFn,
              )
            : Promise.resolve(),
          overlayAssets.migratedItems.length > 0
            ? this.updateCategoryManifest(
                "game-ui",
                overlayAssets.migratedItems,
                expectedOverlayAssets.length,
                targetVersion,
                updateCategoryProgressFn,
              )
            : Promise.resolve(),
        ]);
      }

      const totalMigrated =
        champions.totalFound + items.totalFound + overlayAssets.totalFound;
      const totalErrors =
        champions.errors.length +
        items.errors.length +
        overlayAssets.errors.length;

      return {
        champions,
        items,
        overlayAssets,
        overall: {
          totalMigrated,
          totalErrors,
        },
      };
    } catch (error) {
      console.error("Error during comprehensive migration:", error);
      return {
        champions: {
          migratedItems: [],
          totalFound: 0,
          errors: [String(error)],
        },
        items: { migratedItems: [], totalFound: 0, errors: [] },
        overlayAssets: { migratedItems: [], totalFound: 0, errors: [] },
        overall: { totalMigrated: 0, totalErrors: 1 },
      };
    }
  }
}
