interface StorageData {
    data: unknown;
    timestamp: number;
    version: string;
    checksum?: string;
}

interface StorageOptions {
    ttl?: number; // Time to live in milliseconds
    enableChecksum?: boolean;
}

class UniversalStorage {
    private isElectron: boolean;
    private useLocalData: boolean;

    constructor() {
        this.isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
        this.useLocalData = this.isElectron && localStorage.getItem('electron-use-local-data') === 'true';
    }

    private generateChecksum(data: unknown): string {
        return btoa(JSON.stringify(data)).slice(0, 16);
    }

    private getStorageKey(key: string): string {
        const prefix = this.isElectron && this.useLocalData ? 'electron-local-' : 'web-';
        return `${prefix}${key}`;
    }

    private setLocalStorageWithQuotaHandling(key: string, data: StorageData): void {
        const dataString = JSON.stringify(data);

        // Check if data is too large (> 1MB per item)
        if (dataString.length > 1024 * 1024) {
            console.warn(`Data too large for localStorage (${(dataString.length / 1024 / 1024).toFixed(2)}MB), skipping storage for key: ${key}`);
            return;
        }

        try {
            localStorage.setItem(key, dataString);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                console.warn('localStorage quota exceeded, attempting aggressive cleanup');
                this.aggressiveCleanup();

                try {
                    localStorage.setItem(key, dataString);
                } catch (_retryError) {
                    console.warn('Failed to store data even after aggressive cleanup, trying minimal data');
                    // Try to store minimal data without checksum
                    const minimalData = { data: data.data, timestamp: data.timestamp, version: data.version };
                    try {
                        localStorage.setItem(key, JSON.stringify(minimalData));
                    } catch (_finalError) {
                        console.error('Complete localStorage failure, disabling caching for this session');
                        // Silently fail rather than breaking the app
                    }
                }
            } else {
                console.error('localStorage error:', error);
            }
        }
    }

    private clearOldLocalStorageData(): void {
        const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('web-') || key?.startsWith('electron-local-')) {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const parsed: StorageData = JSON.parse(data);
                        if (parsed.timestamp < cutoffTime) {
                            keysToRemove.push(key);
                        }
                    }
                } catch {
                    // If we can't parse, it's old/corrupt data, remove it
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.debug('Failed to remove old storage item:', key, error);
            }
        });

        console.log(`Cleared ${keysToRemove.length} old storage items`);
    }

    private aggressiveCleanup(): void {
        const keysToRemove: string[] = [];
        const itemSizes: Array<{ key: string; size: number; timestamp: number }> = [];

        // First, collect all our storage items with their sizes
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('web-') || key?.startsWith('electron-local-')) {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const parsed: StorageData = JSON.parse(data);
                        itemSizes.push({
                            key,
                            size: data.length,
                            timestamp: parsed.timestamp
                        });
                    }
                } catch {
                    // If we can't parse, it's corrupt data, remove it
                    keysToRemove.push(key);
                }
            }
        }

        // Remove corrupt data first
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.debug('Failed to remove corrupt storage item:', key, error);
            }
        });

        // Sort by size (largest first) then by age (oldest first)
        itemSizes.sort((a, b) => {
            const sizeDiff = b.size - a.size;
            if (sizeDiff !== 0) return sizeDiff;
            return a.timestamp - b.timestamp;
        });

        // Remove up to 50% of storage items, prioritizing large and old items
        const itemsToRemove = Math.ceil(itemSizes.length * 0.5);
        for (let i = 0; i < itemsToRemove && i < itemSizes.length; i++) {
            try {
                localStorage.removeItem(itemSizes[i].key);
            } catch (error) {
                console.debug('Failed to remove storage item during aggressive cleanup:', itemSizes[i].key, error);
            }
        }

        console.log(`Aggressive cleanup: removed ${keysToRemove.length} corrupt items and ${itemsToRemove} cached items`);
    }

    async set<T>(key: string, data: T, options: StorageOptions = {}): Promise<void> {
        const storageData: StorageData = {
            data,
            timestamp: Date.now(),
            version: '1.0.0',
            ...(options.enableChecksum && { checksum: this.generateChecksum(data) })
        };

        const storageKey = this.getStorageKey(key);

        if (this.isElectron && this.useLocalData && window.electronAPI?.storage?.set) {
            try {
                // Use Electron AppData storage
                await window.electronAPI.storage.set(storageKey, storageData);
            } catch (err) {
                console.debug('Electron storage not available, falling back to localStorage:', err);
                this.setLocalStorageWithQuotaHandling(storageKey, storageData);
            }
        } else {
            // Use localStorage
            this.setLocalStorageWithQuotaHandling(storageKey, storageData);
        }
    }

    async get<T>(key: string, options: StorageOptions = {}): Promise<T | null> {
        const storageKey = this.getStorageKey(key);
        let rawData: string | null = null;

        if (this.isElectron && this.useLocalData && window.electronAPI?.storage?.get) {
            try {
                // Use Electron AppData storage
                const electronData = await window.electronAPI.storage.get(storageKey);
                rawData = electronData ? JSON.stringify(electronData) : null;
            } catch (err) {
                console.debug('Electron storage not available, falling back to localStorage:', err);
                rawData = localStorage.getItem(storageKey);
            }
        } else {
            // Use localStorage
            rawData = localStorage.getItem(storageKey);
        }

        if (!rawData) return null;

        try {
            const storageData: StorageData = JSON.parse(rawData);

            // Check TTL if provided
            if (options.ttl && Date.now() - storageData.timestamp > options.ttl) {
                await this.remove(key);
                return null;
            }

            // Verify checksum if enabled
            if (options.enableChecksum && storageData.checksum) {
                const currentChecksum = this.generateChecksum(storageData.data);
                if (currentChecksum !== storageData.checksum) {
                    console.warn(`Checksum mismatch for key: ${key}`);
                    await this.remove(key);
                    return null;
                }
            }

            return storageData.data as T;
        } catch (error) {
            console.error(`Failed to parse storage data for key: ${key}`, error);
            await this.remove(key);
            return null;
        }
    }

    async remove(key: string): Promise<void> {
        const storageKey = this.getStorageKey(key);

        if (this.isElectron && this.useLocalData && window.electronAPI?.storage?.remove) {
            try {
                await window.electronAPI.storage.remove(storageKey);
            } catch (err) {
                console.debug('Electron storage not available, falling back to localStorage:', err);
                localStorage.removeItem(storageKey);
            }
        } else {
            localStorage.removeItem(storageKey);
        }
    }

    async clear(prefix?: string): Promise<void> {
        if (this.isElectron && this.useLocalData && window.electronAPI?.storage?.clear) {
            try {
                await window.electronAPI.storage.clear(prefix ? this.getStorageKey(prefix) : undefined);
            } catch (err) {
                console.debug('Electron storage not available, falling back to localStorage:', err);
                this.clearLocalStorage(prefix);
            }
        } else {
            this.clearLocalStorage(prefix);
        }
    }

    private clearLocalStorage(prefix?: string): void {
        if (prefix) {
            const fullPrefix = this.getStorageKey(prefix);
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(fullPrefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } else {
            localStorage.clear();
        }
    }

    async getTimestamp(key: string): Promise<number | null> {
        const storageKey = this.getStorageKey(key);
        let rawData: string | null = null;

        if (this.isElectron && this.useLocalData && window.electronAPI?.storage?.get) {
            try {
                const electronData = await window.electronAPI.storage.get(storageKey);
                rawData = electronData ? JSON.stringify(electronData) : null;
            } catch (err) {
                console.debug('Electron storage not available, falling back to localStorage:', err);
                rawData = localStorage.getItem(storageKey);
            }
        } else {
            rawData = localStorage.getItem(storageKey);
        }

        if (!rawData) return null;

        try {
            const storageData: StorageData = JSON.parse(rawData);
            return storageData.timestamp;
        } catch {
            return null;
        }
    }
}

export const storage = new UniversalStorage();
export type { StorageOptions }; 