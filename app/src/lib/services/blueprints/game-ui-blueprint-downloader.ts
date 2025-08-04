import { BaseCacheService } from '../cache/base';
import { AssetValidator } from '../../utils/assetManagement/validator';

interface GameUIAsset {
    category: string;
    filename: string;
    path: string;
    size: number;
}

interface GameUIDownloadProgress {
    stage: 'checking' | 'downloading' | 'complete' | 'error';
    current: number;
    total: number;
    currentAsset?: string;
    message: string;
    errors: string[];
}

interface GameUIDownloadResult {
    success: boolean;
    downloadedCount: number;
    totalCount: number;
    errors: string[];
    totalSize: number;
}

class GameUIBlueprintDownloader extends BaseCacheService {
    private isDownloading = false;
    private gameUIProgressCallback?: (progress: GameUIDownloadProgress) => void;

    // Abstract method implementations
    async getAll(): Promise<unknown[]> {
        throw new Error('Not implemented');
    }

    async getById(_id: string): Promise<unknown | null> {
        throw new Error('Not implemented');
    }

    async clearCache(): Promise<void> {
        await this.initialize();
        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }
        await window.electronAPI.clearAssetCache();
    }

    async getCacheStats(): Promise<{ totalItems: number; cacheSize: number; version: string }> {
        await this.initialize();
        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }
        const statsResult = await window.electronAPI.getAssetCacheStats();
        return {
            totalItems: statsResult.stats?.fileCount || 0,
            cacheSize: statsResult.stats?.totalSize || 0,
            version: this.version
        };
    }

    onGameUIProgress(callback: (progress: GameUIDownloadProgress) => void): void {
        this.gameUIProgressCallback = callback;
    }

    private updateGameUIProgress(progress: Partial<GameUIDownloadProgress>): void {
        if (this.gameUIProgressCallback) {
            const fullProgress: GameUIDownloadProgress = {
                stage: 'checking',
                current: 0,
                total: 0,
                message: '',
                errors: [],
                ...progress
            };
            this.gameUIProgressCallback(fullProgress);
        }
    }

    async downloadAllGameUIBlueprint(): Promise<GameUIDownloadResult> {
        if (this.isDownloading) {
            throw new Error('Download already in progress');
        }

        this.isDownloading = true;
        const errors: string[] = [];
        let processedCount = 0;
        let totalSize = 0;

        try {
            this.updateGameUIProgress({
                stage: 'checking',
                current: 0,
                total: 0,
                message: 'Scanning public assets...'
            });

            // Define the known asset categories and their files
            const assetCategories = {
                'dragonpit': [
                    'infernal.png', 'ocean.png', 'hextech.png', 'chemtech.png',
                    'mountain.png', 'elder.png', 'cloud.png'
                ],
                'default': [
                    'player.png'
                ],
                'scoreboard': [
                    'gold.png', 'grubs.png', 'tower.png'
                ],
                'atakhan': [
                    'atakhan_ruinous.png', 'atakhan_voracious.png'
                ],
                'baronpit': [
                    'baron.png', 'grubs.png', 'herald.png'
                ]
            };

            // Calculate total count
            const totalCount = Object.values(assetCategories).reduce((sum, files) => sum + files.length, 0);

            // Check category progress to see what's already been processed (use League version)
            const version = await this.getLatestVersion();
            const categoryProgress = await super.getCategoryProgress('game-ui', version);
            const completedAssets = categoryProgress.completedItems;
            const alreadyProcessed = completedAssets.length;

            this.updateGameUIProgress({
                stage: 'downloading',
                current: alreadyProcessed,
                total: totalCount,
                message: `Processing ${totalCount - alreadyProcessed} remaining game UI assets...`
            });

            // Process assets by category
            const currentCompletedAssets = [...completedAssets];
            processedCount = alreadyProcessed;

            for (const [category, files] of Object.entries(assetCategories)) {
                this.updateGameUIProgress({
                    current: processedCount,
                    total: totalCount,
                    currentAsset: `Downloading ${category}`,
                    message: `Processing ${category} assets...`
                });

                try {
                    const categoryResult = await this.processCategory(category, files, completedAssets);

                    // Update completed assets list
                    for (const filename of files) {
                        const assetKey = `${category}/${filename}`;
                        if (!completedAssets.includes(assetKey)) {
                            currentCompletedAssets.push(assetKey);
                            processedCount++;

                            // Update category progress after each asset
                            await this.updateCategoryProgress(
                                'game-ui',
                                version,
                                assetKey,
                                totalCount,
                                processedCount,
                                currentCompletedAssets
                            );
                        }
                    }

                    totalSize += categoryResult.totalSize;

                    // Add any errors from category processing
                    errors.push(...categoryResult.errors);
                } catch (error) {
                    const errorMsg = `Failed to process ${category} category: ${error}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);

                    // Update progress to show error
                    this.updateGameUIProgress({
                        current: processedCount,
                        total: totalCount,
                        currentAsset: `${category} category (failed)`,
                        message: `Failed to process ${category}: ${error}`
                    });
                }
            }

            this.updateGameUIProgress({
                stage: 'complete',
                current: processedCount,
                total: totalCount,
                message: 'Game UI downloaded successfully'
            });

            // Clean up manifests after successful completion
            if (processedCount > 0 && errors.length === 0) {
                console.log('All game UI assets processed successfully. Cleaning up manifests for fresh restart capability.');
                await this.cleanupManifestAfterSuccess();
            }

            return {
                success: errors.length === 0,
                downloadedCount: processedCount,
                totalCount,
                errors,
                totalSize
            };

        } catch (error) {
            console.error('Game UI assets processing error:', error);
            this.updateGameUIProgress({
                stage: 'error',
                message: `Processing failed: ${error}`
            });

            return {
                success: false,
                downloadedCount: processedCount,
                totalCount: 0,
                errors: [error as string],
                totalSize
            };
        } finally {
            this.isDownloading = false;
        }
    }

    private async processCategory(category: string, files: string[], completedAssets: string[]): Promise<{ processedCount: number; totalSize: number; errors: string[] }> {
        const errors: string[] = [];
        let processedCount = 0;
        let totalSize = 0;

        try {
            // Process each file in the category
            for (let i = 0; i < files.length; i++) {
                const filename = files[i];
                const assetKey = `${category}/${filename}`;

                // Skip if already processed
                if (completedAssets.includes(assetKey)) {
                    processedCount++;
                    continue;
                }

                try {
                    // Use versioned path for game-ui assets
                    const version = await this.getLatestVersion();
                    const assetKey = `/cache/game/${version}/overlay/${category}/${filename}`;
                    // Check if file already exists using asset validator
                    const cachedPath = AssetValidator.generateCachedPath(assetKey);
                    const fileExists = await AssetValidator.checkFileExists(cachedPath);

                    if (fileExists) {
                        // File already exists, skip processing
                        processedCount++;
                        continue;
                    }

                    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
                        // Download from local development server
                        const assetUrl = `http://localhost:2137/assets/${category}/${filename}`;
                        console.log(`Attempting to download: ${assetUrl} -> ${assetKey}`);

                        try {
                            const downloadResult = await window.electronAPI.downloadAsset(assetUrl, 'overlay', assetKey);
                            
                            if (downloadResult.success && downloadResult.localPath) {
                                // Get file size from the downloaded result
                                const sizeResult = await window.electronAPI.getFileSize(downloadResult.localPath);
                                const fileSize = sizeResult.success ? sizeResult.size || 0 : 0;

                                processedCount++;
                                totalSize += fileSize;
                                console.log(`Successfully processed ${filename}: ${fileSize} bytes`);
                            } else {
                                const errorMsg = `Failed to download ${assetUrl}: ${downloadResult.error}`;
                                console.error(errorMsg);
                                errors.push(errorMsg);
                            }

                        } catch (fileError) {
                            console.error(`Failed to download file ${assetUrl}:`, fileError);
                            
                            // Fallback: try to copy directly from public folder
                            console.log(`Trying fallback: copy from public folder`);
                            try {
                                const sourcePath = `public/assets/${category}/${filename}`;
                                const targetPath = `cache/${assetKey}`;
                                const copyResult = await window.electronAPI.copyAssetFile(sourcePath, targetPath);
                                
                                if (copyResult.success && copyResult.localPath) {
                                    const sizeResult = await window.electronAPI.getFileSize(copyResult.localPath);
                                    const fileSize = sizeResult.success ? sizeResult.size || 0 : 0;
                                    
                                    processedCount++;
                                    totalSize += fileSize;
                                    console.log(`Successfully copied ${filename} from public folder: ${fileSize} bytes`);
                                } else {
                                    throw new Error(`Fallback copy failed: ${copyResult.error}`);
                                }
                            } catch (fallbackError) {
                                console.error(`Fallback copy also failed:`, fallbackError);
                                throw new Error(`Failed to download asset from local server: ${fileError}`);
                            }
                        }
                    } else {
                        throw new Error('Electron API not available - game UI assets can only be processed in Electron environment');
                    }

                    this.updateGameUIProgress({
                        current: processedCount,
                        currentAsset: `${category}/${filename}`,
                        message: `Processed ${filename}`
                    });

                } catch (assetError) {
                    const errorMsg = `Failed to process ${category}/${filename}: ${assetError}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);
                }
            }

        } catch (error) {
            throw error;
        }

        return { processedCount, totalSize, errors };
    }

    async getOverlayAsset(category: string, filename: string): Promise<string | null> {
        try {
            // Use versioned path for game-ui assets to match structure
            const version = await this.getLatestVersion();
            const assetKey = `game/${version}/overlay/${category}/${filename}`;

            // Check if asset exists using asset validator
            const cachedPath = AssetValidator.generateCachedPath(assetKey);
            const fileExists = await AssetValidator.checkFileExists(cachedPath);
            if (fileExists) {
                return cachedPath;
            }


            // If not cached, try to process it
            console.log(`Asset ${assetKey} not found in cache, processing...`);

            // Process the single asset
            if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
                const assetUrl = `http://localhost:2137/assets/${category}/${filename}`;

                try {
                    const downloadResult = await window.electronAPI.downloadAsset(assetUrl, 'overlay', assetKey);
                    if (downloadResult.success && downloadResult.localPath) {
                        return downloadResult.localPath;
                    }
                } catch (error) {
                    console.error(`Failed to process asset ${assetKey}:`, error);
                }
            }

            return null;
        } catch (error) {
            console.error(`Failed to get overlay asset ${category}/${filename}:`, error);
            return null;
        }
    }

    async checkOverlayAssetsStatus(): Promise<{ hasAssets: boolean; categories: string[]; totalCount: number }> {
        try {
            // Define the known asset categories and their files
            const assetCategories = {
                'dragonpit': [
                    'infernal.png', 'ocean.png', 'hextech.png', 'chemtech.png',
                    'mountain.png', 'elder.png', 'cloud.png'
                ],
                'default': [
                    'player.png'
                ],
                'scoreboard': [
                    'gold.png', 'grubs.png', 'tower.png'
                ],
                'atakhan': [
                    'atakhan_ruinous.png', 'atakhan_voracious.png'
                ],
                'baronpit': [
                    'baron.png', 'grubs.png', 'herald.png'
                ]
            };

            const categories = Object.keys(assetCategories);
            const totalCount = Object.values(assetCategories).reduce((sum, files) => sum + files.length, 0);

            return {
                hasAssets: totalCount > 0,
                categories,
                totalCount
            };

        } catch (error) {
            console.error('Failed to check overlay assets status:', error);
            return { hasAssets: false, categories: [], totalCount: 0 };
        }
    }

    protected async getCategoryProgress(category: string): Promise<{ downloaded: number; total: number; completedItems: string[] }> {
        try {
            // Using new category manifest system instead of individual asset tracking
            const version = await this.getLatestVersion();
            const categoryProgress = await super.getCategoryProgress('game-ui', version);

            return {
                downloaded: categoryProgress.completedItems.length,
                total: categoryProgress.completedItems.length,
                completedItems: categoryProgress.completedItems
            };
        } catch (error) {
            console.error(`Failed to get category progress for ${category}:`, error);
            return { downloaded: 0, total: 0, completedItems: [] };
        }
    }

    private async cleanupManifestAfterSuccess(): Promise<void> {
        try {
            if (typeof window === 'undefined' || !window.electronAPI) {
                return;
            }

            console.log('Game UI manifest cleared successfully. System will restart from scratch if files are deleted.');
        } catch (error) {
            console.error('Failed to cleanup manifest after successful download:', error);
        }
    }

    isCurrentlyDownloading(): boolean {
        return this.isDownloading;
    }
}

export const gameUIBlueprintDownloader = new GameUIBlueprintDownloader();
export type { GameUIAsset, GameUIDownloadProgress, GameUIDownloadResult }; 