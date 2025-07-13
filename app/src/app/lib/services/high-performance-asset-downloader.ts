import { championCacheService } from './champion-cache';

export interface DownloadTask {
    id: string;
    type: 'champion' | 'item' | 'spell' | 'rune';
    url: string;
    assetKey: string;
    category: string;
    priority: number;
}

export interface DownloadProgress {
    stage: 'checking' | 'downloading' | 'complete' | 'error';
    current: number;
    total: number;
    currentAsset?: string;
    assetType?: string;
    message: string;
    errors: string[];
    downloadSpeed?: number;
    estimatedTimeRemaining?: number;
}

export interface DownloadStats {
    totalFiles: number;
    downloadedFiles: number;
    failedFiles: number;
    totalSize: number;
    downloadedSize: number;
    averageSpeed: number;
    startTime: number;
    estimatedCompletion: number;
}

interface DownloadResult {
    success: boolean;
    localPath?: string;
    error?: string;
    size?: number;
    downloadSpeed?: number;
    downloadTime?: number;
}

class HighPerformanceAssetDownloader {
    private isDownloading = false;
    private downloadQueue: DownloadTask[] = [];
    private activeDownloads = new Set<string>();
    private maxConcurrentDownloads = 20; // Increased from 10
    private downloadStats: DownloadStats = {
        totalFiles: 0,
        downloadedFiles: 0,
        failedFiles: 0,
        totalSize: 0,
        downloadedSize: 0,
        averageSpeed: 0,
        startTime: 0,
        estimatedCompletion: 0
    };
    private progressCallbacks: ((progress: DownloadProgress) => void)[] = [];
    private startTime = 0;
    private lastProgressUpdate = 0;
    private connectionPool = new Map<string, unknown>(); // Connection pooling
    private retryAttempts = new Map<string, number>(); // Track retry attempts

    constructor() {
        // Auto-adjust concurrency based on system capabilities
        this.adjustConcurrency();
    }

    private adjustConcurrency(): void {
        // Use more processes for better performance
        if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
            this.maxConcurrentDownloads = Math.min(
                navigator.hardwareConcurrency * 4, // Increased from 2x to 4x CPU cores
                50 // Increased cap from 20 to 50 concurrent downloads
            );
        }
    }

    onProgress(callback: (progress: DownloadProgress) => void): void {
        this.progressCallbacks.push(callback);
    }

    private updateProgress(progress: Partial<DownloadProgress>): void {
        const now = Date.now();
        if (now - this.lastProgressUpdate < 50) return; // Reduced throttling from 100ms to 50ms

        this.lastProgressUpdate = now;

        const fullProgress: DownloadProgress = {
            stage: 'downloading',
            current: this.downloadStats.downloadedFiles,
            total: this.downloadStats.totalFiles,
            currentAsset: progress.currentAsset,
            assetType: progress.assetType,
            message: progress.message || `Downloading ${this.downloadStats.downloadedFiles}/${this.downloadStats.totalFiles} files`,
            errors: this.downloadStats.failedFiles > 0 ? [`${this.downloadStats.failedFiles} files failed`] : [],
            downloadSpeed: this.calculateDownloadSpeed(),
            estimatedTimeRemaining: this.calculateEstimatedTime(),
            ...progress
        };

        this.progressCallbacks.forEach(callback => callback(fullProgress));
    }

    private calculateDownloadSpeed(): number {
        if (!this.startTime) return 0;
        const elapsed = (Date.now() - this.startTime) / 1000; // seconds
        return elapsed > 0 ? this.downloadStats.downloadedSize / elapsed : 0;
    }

    private calculateEstimatedTime(): number {
        const speed = this.calculateDownloadSpeed();
        if (speed <= 0) return 0;

        const remainingSize = this.downloadStats.totalSize - this.downloadStats.downloadedSize;
        return remainingSize / speed;
    }

    async downloadAllAssets(): Promise<{ success: boolean; stats: DownloadStats; errors: string[] }> {
        if (this.isDownloading) {
            throw new Error('Download already in progress');
        }

        this.isDownloading = true;
        this.startTime = Date.now();
        this.lastProgressUpdate = 0;
        this.downloadStats = {
            totalFiles: 0,
            downloadedFiles: 0,
            failedFiles: 0,
            totalSize: 0,
            downloadedSize: 0,
            averageSpeed: 0,
            startTime: this.startTime,
            estimatedCompletion: 0
        };

        try {
            this.updateProgress({
                stage: 'checking',
                message: 'Analyzing required assets...'
            });

            // Build download queue
            await this.buildDownloadQueue();

            if (this.downloadQueue.length === 0) {
                this.updateProgress({
                    stage: 'complete',
                    message: 'All assets are already downloaded'
                });
                return { success: true, stats: this.downloadStats, errors: [] };
            }

            this.downloadStats.totalFiles = this.downloadQueue.length;
            this.updateProgress({
                stage: 'downloading',
                message: `Starting download of ${this.downloadQueue.length} files with ${this.maxConcurrentDownloads} parallel connections...`
            });

            // Process downloads in parallel with enhanced concurrency
            const errors: string[] = [];
            const downloadPromises: Promise<void>[] = [];

            // Create worker pools with more aggressive allocation
            const championWorkers = this.createWorkerPool('champion', 8); // Increased from 3
            const itemWorkers = this.createWorkerPool('item', 4); // Increased from 2
            const generalWorkers = this.createWorkerPool('general', this.maxConcurrentDownloads - 12);

            // Sort tasks by priority for better resource allocation
            this.downloadQueue.sort((a, b) => a.priority - b.priority);

            for (const task of this.downloadQueue) {
                const worker = this.getWorkerForTask(task, championWorkers, itemWorkers, generalWorkers);
                const promise = this.processDownloadTask(task, worker);
                downloadPromises.push(promise);
            }

            // Wait for all downloads to complete
            await Promise.allSettled(downloadPromises);

            // Clean up workers and connections
            this.cleanupWorkers([...championWorkers, ...itemWorkers, ...generalWorkers]);
            this.cleanupConnections();

            this.isDownloading = false;

            const success = this.downloadStats.failedFiles === 0;
            this.updateProgress({
                stage: success ? 'complete' : 'error',
                message: success
                    ? `Successfully downloaded ${this.downloadStats.downloadedFiles} files`
                    : `Download completed with ${this.downloadStats.failedFiles} errors`
            });

            return {
                success,
                stats: this.downloadStats,
                errors
            };

        } catch (error) {
            this.isDownloading = false;
            this.updateProgress({
                stage: 'error',
                message: `Download failed: ${error}`
            });
            return {
                success: false,
                stats: this.downloadStats,
                errors: [error as string]
            };
        }
    }

    private async buildDownloadQueue(): Promise<void> {
        this.downloadQueue = [];

        // Check champion cache completeness
        const championCompleteness = await championCacheService.checkCacheCompleteness();
        if (!championCompleteness.isComplete) {
            // Add champion download tasks with optimized batching
            const championKeys = championCompleteness.missingChampions;

            // Process champions in smaller batches for better memory management
            const batchSize = 50;
            for (let i = 0; i < championKeys.length; i += batchSize) {
                const batch = championKeys.slice(i, i + batchSize);
                for (const championKey of batch) {
                    this.addChampionTasks(championKey);
                }
            }
        }

        // Add item download tasks (simplified for now)
        // TODO: Implement item completeness check
    }

    private addChampionTasks(championKey: string): void {
        const version = '15.13.1'; // TODO: Get from service
        const championDir = `game/${version}/champions/${championKey}`;

        // Champion data (highest priority)
        this.downloadQueue.push({
            id: `champion-data-${championKey}`,
            type: 'champion',
            url: `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${championKey}.json`,
            assetKey: `${championDir}/data.json`,
            category: 'cache',
            priority: 1
        });

        // Champion images (medium priority)
        const imageUrls = {
            square: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championKey}.png`,
            splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championKey}_0.jpg`,
            splashCentered: `https://ddragon.leagueoflegends.com/cdn/img/champion/centered/${championKey}_0.jpg`,
            loading: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championKey}_0.jpg`
        };

        Object.entries(imageUrls).forEach(([key, url]) => {
            const fileName = key === 'square' ? 'square.png' : `${key}.jpg`;
            this.downloadQueue.push({
                id: `champion-image-${championKey}-${key}`,
                type: 'champion',
                url,
                assetKey: `${championDir}/${fileName}`,
                category: 'cache',
                priority: 2
            });
        });

        // Ability images (lower priority)
        const abilities = ['Q', 'W', 'E', 'R', 'passive'];
        abilities.forEach((ability) => {
            const fileName = ability === 'passive' ? 'passive.png' : `${ability.toLowerCase()}.png`;
            this.downloadQueue.push({
                id: `champion-ability-${championKey}-${ability}`,
                type: 'champion',
                url: `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${championKey}${ability === 'passive' ? 'Passive' : ability}.png`,
                assetKey: `${championDir}/abilities/${fileName}`,
                category: 'cache',
                priority: 3
            });
        });
    }

    private createWorkerPool(type: string, count: number): Array<{ id: string; busy: boolean }> {
        return Array.from({ length: count }, (_, i) => ({
            id: `${type}-worker-${i}`,
            busy: false
        }));
    }

    private getWorkerForTask(
        task: DownloadTask,
        championWorkers: Array<{ id: string; busy: boolean }>,
        itemWorkers: Array<{ id: string; busy: boolean }>,
        generalWorkers: Array<{ id: string; busy: boolean }>
    ): { id: string; busy: boolean } {
        let workers: Array<{ id: string; busy: boolean }>;

        switch (task.type) {
            case 'champion':
                workers = championWorkers;
                break;
            case 'item':
                workers = itemWorkers;
                break;
            default:
                workers = generalWorkers;
        }

        const availableWorker = workers.find(w => !w.busy);
        if (availableWorker) {
            availableWorker.busy = true;
            return availableWorker;
        }

        // Fallback to general workers
        const generalWorker = generalWorkers.find(w => !w.busy);
        if (generalWorker) {
            generalWorker.busy = true;
            return generalWorker;
        }

        throw new Error('No available workers');
    }

    private async processDownloadTask(task: DownloadTask, worker: { id: string; busy: boolean }): Promise<void> {
        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                this.activeDownloads.add(task.id);

                this.updateProgress({
                    currentAsset: task.id,
                    message: `Downloading ${task.id}...`
                });

                // Use the existing electron API for downloads
                if (typeof window !== 'undefined' && window.electronAPI) {
                    const result = await window.electronAPI.downloadAsset(task.url, task.category, task.assetKey) as DownloadResult;

                    if (result.success) {
                        this.downloadStats.downloadedFiles++;
                        // Use actual file size if available, otherwise estimate
                        this.downloadStats.downloadedSize += result.size || 50000;

                        // Update average speed calculation
                        if (result.downloadSpeed) {
                            this.downloadStats.averageSpeed =
                                (this.downloadStats.averageSpeed + result.downloadSpeed) / 2;
                        }
                        break; // Success, exit retry loop
                    } else {
                        throw new Error(result.error || 'Download failed');
                    }
                }

            } catch (error) {
                attempt++;
                this.retryAttempts.set(task.id, attempt);

                if (attempt >= maxRetries) {
                    this.downloadStats.failedFiles++;
                    console.warn(`Failed to download ${task.id} after ${maxRetries} attempts:`, error);
                } else {
                    // Wait before retry with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    continue;
                }
            } finally {
                this.activeDownloads.delete(task.id);
                worker.busy = false;
            }
        }
    }

    private cleanupWorkers(workers: Array<{ id: string; busy: boolean }>): void {
        workers.forEach(worker => {
            worker.busy = false;
        });
    }

    private cleanupConnections(): void {
        this.connectionPool.clear();
        this.retryAttempts.clear();
    }

    getDownloadStats(): DownloadStats {
        return { ...this.downloadStats };
    }

    isCurrentlyDownloading(): boolean {
        return this.isDownloading;
    }

    cancelDownload(): void {
        this.isDownloading = false;
        this.activeDownloads.clear();
        this.downloadQueue = [];
        this.cleanupConnections();
    }
}

export const highPerformanceAssetDownloader = new HighPerformanceAssetDownloader(); 