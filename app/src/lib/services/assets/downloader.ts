import { championCacheService } from "./champion";
import { assetIntegrityChecker, AssetIntegrityResult } from "./integrity-checker";
import { assetDownloaderManager } from "./downloader-manager";
import { assetCounterService } from "./asset-counter";

export interface DownloadTask {
  id: string;
  type: "champion" | "item" | "spell" | "rune";
  url: string;
  assetKey: string;
  category: string;
  priority: number;
  size?: number;
}

export interface DownloadProgress {
  stage: "checking" | "downloading" | "complete" | "error";
  current: number;
  total: number;
  currentAsset?: string;
  assetType?: string;
  message: string;
  errors: string[];
  downloadSpeed?: number;
  estimatedTimeRemaining?: number;
  activeConnections: number;
  queueLength: number;
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
  peakConnections: number;
  averageConnections: number;
}

interface DownloadResult {
  success: boolean;
  localPath?: string;
  error?: string;
  size?: number;
  downloadSpeed?: number;
  downloadTime?: number;
}

export class AssetDownloader {
  private isDownloading = false;
  private paused = false;
  private downloadQueue: DownloadTask[] = [];
  private activeDownloads = new Set<string>();
  private maxConcurrentDownloads = 50; // Ultra-aggressive concurrency
  private downloadStats: DownloadStats = {
    totalFiles: 0,
    downloadedFiles: 0,
    failedFiles: 0,
    totalSize: 0,
    downloadedSize: 0,
    averageSpeed: 0,
    startTime: 0,
    estimatedCompletion: 0,
    peakConnections: 0,
    averageConnections: 0
  };
  private progressCallbacks: ((progress: DownloadProgress) => void)[] = [];
  private startTime = 0;
  private lastProgressUpdate = 0;
  private connectionCount = 0;
  private totalConnections = 0;
  private connectionSamples = 0;
  private retryAttempts = new Map<string, number>();
  private downloadChunks = new Map<string, number>(); // Track download chunks for progress

  constructor() {
    this.adjustConcurrency();
  }

  private adjustConcurrency(): void {
    // Ultra-aggressive concurrency settings
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
      this.maxConcurrentDownloads = Math.min(
        navigator.hardwareConcurrency * 8, // 8x CPU cores for maximum throughput
        100 // Cap at 100 concurrent downloads
      );
    }
  }

  onProgress(callback: (progress: DownloadProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  private updateProgress(progress: Partial<DownloadProgress>): void {
    const now = Date.now();
    if (now - this.lastProgressUpdate < 25) return; // Ultra-fast updates (25ms)

    this.lastProgressUpdate = now;

    const fullProgress: DownloadProgress = {
      stage: "downloading",
      current: this.downloadStats.downloadedFiles,
      total: this.downloadStats.totalFiles,
      currentAsset: progress.currentAsset,
      assetType: progress.assetType,
      message:
        progress.message || `Downloading ${this.downloadStats.downloadedFiles}/${this.downloadStats.totalFiles} files`,
      errors: this.downloadStats.failedFiles > 0 ? [`${this.downloadStats.failedFiles} files failed`] : [],
      downloadSpeed: this.calculateDownloadSpeed(),
      estimatedTimeRemaining: this.calculateEstimatedTime(),
      activeConnections: this.connectionCount,
      queueLength: this.downloadQueue.length,
      ...progress
    };

    this.progressCallbacks.forEach((callback) => callback(fullProgress));
  }

  private calculateDownloadSpeed(): number {
    if (!this.startTime) return 0;
    const elapsed = (Date.now() - this.startTime) / 1000;
    return elapsed > 0 ? this.downloadStats.downloadedSize / elapsed : 0;
  }

  private calculateEstimatedTime(): number {
    const speed = this.calculateDownloadSpeed();
    if (speed <= 0) return 0;

    const remainingSize = this.downloadStats.totalSize - this.downloadStats.downloadedSize;
    return remainingSize / speed;
  }

  private updateConnectionStats(): void {
    this.connectionCount = this.activeDownloads.size;
    this.totalConnections += this.connectionCount;
    this.connectionSamples++;

    if (this.connectionCount > this.downloadStats.peakConnections) {
      this.downloadStats.peakConnections = this.connectionCount;
    }

    this.downloadStats.averageConnections = this.totalConnections / this.connectionSamples;
  }

  async downloadAllAssets(): Promise<{
    success: boolean;
    stats: DownloadStats;
    errors: string[];
  }> {
    if (this.isDownloading) {
      throw new Error("Download already in progress");
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
      estimatedCompletion: 0,
      peakConnections: 0,
      averageConnections: 0
    };
    this.connectionCount = 0;
    this.totalConnections = 0;
    this.connectionSamples = 0;

    try {
      this.updateProgress({
        stage: "checking",
        message: "Calculating total assets..."
      });

      // Get expected total asset count first for accurate progress
      const expectedAssetCounts = await assetCounterService.getTotalAssetCounts();
      
      this.updateProgress({
        stage: "checking",
        message: `Found ${expectedAssetCounts.total} total assets. Checking data integrity...`
      });

      // Check data integrity
      const integrityResult = await assetIntegrityChecker.checkAllAssets();

      if (integrityResult.isValid) {
        this.updateProgress({
          stage: "complete",
          message: "All assets are valid and up to date"
        });
        return { success: true, stats: this.downloadStats, errors: [] };
      }

      this.updateProgress({
        stage: "checking",
        message: `Found ${integrityResult.missingCount} missing and ${integrityResult.corruptedCount} corrupted assets. Building download queue...`
      });

      await this.buildDownloadQueueFromIntegrity(integrityResult);

      if (this.downloadQueue.length === 0) {
        this.updateProgress({
          stage: "complete",
          message: "All assets are already downloaded"
        });
        return { success: true, stats: this.downloadStats, errors: [] };
      }

      this.downloadStats.totalFiles = this.downloadQueue.length;
      this.updateProgress({
        stage: "downloading",
        message: `Downloading ${this.downloadQueue.length} assets with ${this.maxConcurrentDownloads} parallel connections...`
      });

      // Ultra-aggressive parallel processing
      const errors: string[] = [];
      const downloadPromises: Promise<void>[] = [];

      // Create specialized worker pools
      const championWorkers = this.createWorkerPool("champion", 15); // 15 champion workers
      const itemWorkers = this.createWorkerPool("item", 10); // 10 item workers
      const generalWorkers = this.createWorkerPool("general", this.maxConcurrentDownloads - 25);

      // Sort by priority and size for optimal resource allocation
      this.downloadQueue.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return (b.size || 0) - (a.size || 0); // Larger files first
      });

      // Process downloads with ultra-aggressive concurrency
      for (const task of this.downloadQueue) {
        const worker = this.getWorkerForTask(task, championWorkers, itemWorkers, generalWorkers);
        const promise = this.processDownloadTask(task, worker);
        downloadPromises.push(promise);
      }

      await Promise.allSettled(downloadPromises);

      this.cleanupWorkers([...championWorkers, ...itemWorkers, ...generalWorkers]);
      this.cleanupConnections();

      this.isDownloading = false;

      const success = this.downloadStats.failedFiles === 0;
      this.updateProgress({
        stage: success ? "complete" : "error",
        message: success
          ? `Successfully downloaded ${this.downloadStats.downloadedFiles} files at ${this.formatSpeed(this.downloadStats.averageSpeed)}`
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
        stage: "error",
        message: `Download failed: ${error}`
      });
      return {
        success: false,
        stats: this.downloadStats,
        errors: [error as string]
      };
    }
  }

  private async buildDownloadQueueFromIntegrity(integrityResult: AssetIntegrityResult): Promise<void> {
    this.downloadQueue = [];

    const allMissingAssets = [...integrityResult.missingAssets, ...integrityResult.corruptedAssets];

    // Group assets by type for better organization
    const championAssets = allMissingAssets.filter((asset) => asset.includes("/champions/"));
    const itemAssets = allMissingAssets.filter((asset) => asset.includes("/item/"));
    const spellAssets = allMissingAssets.filter((asset) => asset.includes("/spell/"));
    const runeAssets = allMissingAssets.filter((asset) => asset.includes("/rune/"));
    const otherAssets = allMissingAssets.filter(
      (asset) =>
        !asset.includes("/champions/") &&
        !asset.includes("/item/") &&
        !asset.includes("/spell/") &&
        !asset.includes("/rune/")
    );

    // Add champion assets
    for (const assetKey of championAssets) {
      this.addAssetTask(assetKey, "champion", 1);
    }

    // Add item assets
    for (const assetKey of itemAssets) {
      this.addAssetTask(assetKey, "item", 2);
    }

    // Add spell assets
    for (const assetKey of spellAssets) {
      this.addAssetTask(assetKey, "spell", 3);
    }

    // Add rune assets
    for (const assetKey of runeAssets) {
      this.addAssetTask(assetKey, "rune", 3);
    }

    // Add other assets
    for (const assetKey of otherAssets) {
      this.addAssetTask(assetKey, "general", 4);
    }
  }

  private async buildDownloadQueue(): Promise<void> {
    this.downloadQueue = [];

    const championCompleteness = await championCacheService.checkCacheCompleteness();
    if (!championCompleteness.isComplete) {
      const championKeys = championCompleteness.missingChampions;

      // Process in larger batches for better throughput
      const batchSize = 100; // Increased batch size
      for (let i = 0; i < championKeys.length; i += batchSize) {
        const batch = championKeys.slice(i, i + batchSize);
        for (const championKey of batch) {
          this.addChampionTasks(championKey);
        }
      }
    }
  }

  private addAssetTask(
    assetKey: string,
    type: "champion" | "item" | "spell" | "rune" | "general",
    priority: number
  ): void {
    const version = "15.15.1";

    // Generate URL based on asset key
    const url = this.generateUrlFromAssetKey(assetKey, version);

    // Estimate size based on file type
    const size = this.estimateSizeFromAssetKey(assetKey);

    this.downloadQueue.push({
      id: assetKey,
      type: type as "champion" | "item" | "spell" | "rune",
      url,
      assetKey,
      category: "cache",
      priority,
      size
    });
  }

  private generateUrlFromAssetKey(assetKey: string, version: string): string {
    // Extract champion name from asset key
    const championMatch = assetKey.match(/champion\/([^\/]+)\//);
    if (championMatch) {
      const championKey = championMatch[1];

      if (assetKey.endsWith("/data.json")) {
        return `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${championKey}.json`;
      } else if (assetKey.endsWith("/square.png")) {
        return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championKey}.png`;
      } else if (assetKey.endsWith("/splash.jpg")) {
        return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championKey}_0.jpg`;
      } else if (assetKey.endsWith("/splashCentered.jpg")) {
        return `https://ddragon.leagueoflegends.com/cdn/img/champion/centered/${championKey}_0.jpg`;
      } else if (assetKey.endsWith("/loading.jpg")) {
        return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championKey}_0.jpg`;
      } else if (assetKey.includes("/abilities/")) {
        const abilityMatch = assetKey.match(/abilities\/([^\/]+)\.png/);
        if (abilityMatch) {
          const ability = abilityMatch[1];
          const abilityKey = ability === "passive" ? "Passive" : ability.toUpperCase();
          return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${championKey}${abilityKey}.png`;
        }
      }
    }

    // Fallback for unknown asset types
    return `https://ddragon.leagueoflegends.com/cdn/${version}/${assetKey}`;
  }

  private estimateSizeFromAssetKey(assetKey: string): number {
    if (assetKey.endsWith(".json")) return 5000;
    if (assetKey.endsWith(".png")) {
      if (assetKey.includes("/abilities/")) return 30000;
      if (assetKey.includes("/square.png")) return 50000;
      return 100000;
    }
    if (assetKey.endsWith(".jpg")) {
      if (assetKey.includes("/splash")) return 200000;
      if (assetKey.includes("/loading")) return 150000;
      return 100000;
    }
    return 50000; // Default estimate
  }

  private addChampionTasks(championKey: string): void {
    const version = "15.15.1";
    const championDir = `game/${version}/champions/${championKey}`;

    // Champion data (highest priority, smallest size)
    this.downloadQueue.push({
      id: `champion-data-${championKey}`,
      type: "champion",
      url: `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${championKey}.json`,
      assetKey: `${championDir}/data.json`,
      category: "cache",
      priority: 1,
      size: 5000 // Estimated size
    });

    // Champion images (medium priority, larger files)
    const imageUrls = {
      square: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championKey}.png`,
      splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championKey}_0.jpg`,
      splashCentered: `https://ddragon.leagueoflegends.com/cdn/img/champion/centered/${championKey}_0.jpg`,
      loading: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championKey}_0.jpg`
    };

    const imageSizes = {
      square: 50000,
      splash: 200000,
      splashCentered: 200000,
      loading: 150000
    };

    Object.entries(imageUrls).forEach(([key, url]) => {
      const fileName = key === "square" ? "square.png" : `${key}.jpg`;
      this.downloadQueue.push({
        id: `champion-image-${championKey}-${key}`,
        type: "champion",
        url,
        assetKey: `${championDir}/${fileName}`,
        category: "cache",
        priority: 2,
        size: imageSizes[key as keyof typeof imageSizes]
      });
    });

    // Ability images (lower priority, smaller files)
    const abilities = ["Q", "W", "E", "R", "passive"];
    abilities.forEach((ability) => {
      const fileName = ability === "passive" ? "passive.png" : `${ability.toLowerCase()}.png`;
      this.downloadQueue.push({
        id: `champion-ability-${championKey}-${ability}`,
        type: "champion",
        url: `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${championKey}${ability === "passive" ? "Passive" : ability}.png`,
        assetKey: `${championDir}/abilities/${fileName}`,
        category: "cache",
        priority: 3,
        size: 30000 // Estimated size
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
      case "champion":
        workers = championWorkers;
        break;
      case "item":
        workers = itemWorkers;
        break;
      default:
        workers = generalWorkers;
    }

    const availableWorker = workers.find((w) => !w.busy);
    if (availableWorker) {
      availableWorker.busy = true;
      return availableWorker;
    }

    const generalWorker = generalWorkers.find((w) => !w.busy);
    if (generalWorker) {
      generalWorker.busy = true;
      return generalWorker;
    }

    throw new Error("No available workers");
  }

  private async processDownloadTask(task: DownloadTask, worker: { id: string; busy: boolean }): Promise<void> {
    const maxRetries = 2; // Reduced retries for faster failure detection
    let attempt = 0;

    while (attempt < maxRetries) {
      // Check if downloader is paused
      if (this.paused) {
        console.log("Download paused, skipping task:", task.id);
        break;
      }

      try {
        this.activeDownloads.add(task.id);
        this.updateConnectionStats();

        this.updateProgress({
          currentAsset: this.getAssetDisplayName(task.assetKey),
          message: `Downloading assets... (${this.downloadStats.downloadedFiles + 1}/${this.downloadStats.totalFiles})`
        });

        if (typeof window !== "undefined" && window.electronAPI) {
          const result = (await window.electronAPI.downloadAsset(
            task.url,
            task.category,
            task.assetKey
          )) as DownloadResult;

          if (result.success) {
            this.downloadStats.downloadedFiles++;
            this.downloadStats.downloadedSize += result.size || task.size || 50000;

            if (result.downloadSpeed) {
              this.downloadStats.averageSpeed = (this.downloadStats.averageSpeed + result.downloadSpeed) / 2;
            }
            break;
          } else {
            throw new Error(result.error || "Download failed");
          }
        }
      } catch (error) {
        attempt++;
        this.retryAttempts.set(task.id, attempt);

        if (attempt >= maxRetries) {
          this.downloadStats.failedFiles++;
          console.warn(`Failed to download ${task.id} after ${maxRetries} attempts:`, error);
        } else {
          // Shorter backoff for faster retries
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 500));
          continue;
        }
      } finally {
        this.activeDownloads.delete(task.id);
        this.updateConnectionStats();
        worker.busy = false;
      }
    }
  }

  private cleanupWorkers(workers: Array<{ id: string; busy: boolean }>): void {
    workers.forEach((worker) => {
      worker.busy = false;
    });
  }

  private cleanupConnections(): void {
    this.retryAttempts.clear();
    this.downloadChunks.clear();
  }

  private getAssetDisplayName(assetKey: string): string {
    // Extract a clean display name from the asset key
    const parts = assetKey.split("/");
    const fileName = parts[parts.length - 1];
    const directory = parts[parts.length - 2];

    if (assetKey.includes("/champions/")) {
      const championMatch = assetKey.match(/champions\/([^\/]+)/);
      if (championMatch) {
        const championName = championMatch[1];
        if (fileName === "data.json") return `${championName} Data`;
        if (fileName === "square.png") return `${championName} Icon`;
        if (fileName === "splash.jpg") return `${championName} Splash`;
        if (fileName === "splashCentered.jpg") return `${championName} Centered`;
        if (fileName === "loading.jpg") return `${championName} Loading`;
        if (fileName.includes(".png") && directory === "abilities") {
          const ability = fileName.replace(".png", "").toUpperCase();
          return `${championName} ${ability}`;
        }
        return `${championName} ${fileName}`;
      }
    }

    // For other asset types
    if (assetKey.includes("/item/")) return `Item: ${fileName}`;
    if (assetKey.includes("/spell/")) return `Spell: ${fileName}`;
    if (assetKey.includes("/rune/")) return `Rune: ${fileName}`;

    return fileName;
  }

  private formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
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

  pauseDownload(): void {
    this.paused = true;
    console.log("Asset downloader paused");
  }

  resumeDownload(): void {
    this.paused = false;
    console.log("Asset downloader resumed");
  }

  isPaused(): boolean {
    return this.paused;
  }
}

export const assetDownloader = new AssetDownloader();

// Register the downloader with the manager
assetDownloaderManager.setDownloader(assetDownloader);
