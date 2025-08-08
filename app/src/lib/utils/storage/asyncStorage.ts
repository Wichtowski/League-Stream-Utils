interface StorageOptions {
    ttl?: number;
    enableChecksum?: boolean;
}

interface StorageItem<T> {
    data: T;
    timestamp: number;
    checksum?: string;
}

class AsyncStorage {
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

    async get<T>(key: string, options?: StorageOptions): Promise<T | null> {
        try {
            return await new Promise<T | null>((resolve) => {
                // Use requestIdleCallback or setTimeout to avoid blocking
                if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                    (
                        window as Window & {
                            requestIdleCallback: (callback: () => void) => void;
                        }
                    ).requestIdleCallback(() => {
                        resolve(this.getSync<T>(key, options));
                    });
                } else {
                    setTimeout(() => {
                        resolve(this.getSync<T>(key, options));
                    }, 0);
                }
            });
        } catch (error) {
            console.error('AsyncStorage get error:', error);
            return null;
        }
    }

    async set<T>(key: string, data: T, options?: StorageOptions): Promise<void> {
        try {
            await new Promise<void>((resolve) => {
                // Use requestIdleCallback or setTimeout to avoid blocking
                if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                    (
                        window as Window & {
                            requestIdleCallback: (callback: () => void) => void;
                        }
                    ).requestIdleCallback(() => {
                        this.setSync(key, data, options);
                        resolve();
                    });
                } else {
                    setTimeout(() => {
                        this.setSync(key, data, options);
                        resolve();
                    }, 0);
                }
            });
        } catch (error) {
            console.error('AsyncStorage set error:', error);
        }
    }

    async remove(key: string): Promise<void> {
        try {
            await new Promise<void>((resolve) => {
                // Use requestIdleCallback or setTimeout to avoid blocking
                if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                    (
                        window as Window & {
                            requestIdleCallback: (callback: () => void) => void;
                        }
                    ).requestIdleCallback(() => {
                        this.removeSync(key);
                        resolve();
                    });
                } else {
                    setTimeout(() => {
                        this.removeSync(key);
                        resolve();
                    }, 0);
                }
            });
        } catch (error) {
            console.error('AsyncStorage remove error:', error);
        }
    }

    async getTimestamp(key: string): Promise<number | null> {
        try {
            return await new Promise<number | null>((resolve) => {
                if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                    (
                        window as Window & {
                            requestIdleCallback: (callback: () => void) => void;
                        }
                    ).requestIdleCallback(() => {
                        resolve(this.getTimestampSync(key));
                    });
                } else {
                    setTimeout(() => {
                        resolve(this.getTimestampSync(key));
                    }, 0);
                }
            });
        } catch (error) {
            console.error('AsyncStorage getTimestamp error:', error);
            return null;
        }
    }

    private getSync<T>(key: string, options?: StorageOptions): T | null {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const parsed: StorageItem<T> = JSON.parse(item);
            const ttl = options?.ttl || this.DEFAULT_TTL;

            // Check TTL
            if (Date.now() - parsed.timestamp > ttl) {
                localStorage.removeItem(key);
                return null;
            }

            // Check checksum if enabled
            if (options?.enableChecksum && parsed.checksum) {
                const currentChecksum = this.calculateChecksum(parsed.data);
                if (currentChecksum !== parsed.checksum) {
                    localStorage.removeItem(key);
                    return null;
                }
            }

            return parsed.data;
        } catch (error) {
            console.error('AsyncStorage getSync error:', error);
            return null;
        }
    }

    private setSync<T>(key: string, data: T, options?: StorageOptions): void {
        try {
            const item: StorageItem<T> = {
                data,
                timestamp: Date.now(),
                checksum: options?.enableChecksum ? this.calculateChecksum(data) : undefined
            };

            localStorage.setItem(key, JSON.stringify(item));
        } catch (error) {
            console.error('AsyncStorage setSync error:', error);
        }
    }

    private removeSync(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('AsyncStorage removeSync error:', error);
        }
    }

    private getTimestampSync(key: string): number | null {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const parsed: StorageItem<unknown> = JSON.parse(item);
            return parsed.timestamp;
        } catch (error) {
            console.error('AsyncStorage getTimestampSync error:', error);
            return null;
        }
    }

    private calculateChecksum(data: unknown): string {
        // Simple checksum calculation
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    // Batch operations for better performance
    async getMultiple<T>(keys: string[], options?: StorageOptions): Promise<Record<string, T | null>> {
        const results: Record<string, T | null> = {};

        await Promise.all(
            keys.map(async (key) => {
                results[key] = await this.get<T>(key, options);
            })
        );

        return results;
    }

    async setMultiple<T>(items: Record<string, T>, options?: StorageOptions): Promise<void> {
        await Promise.all(Object.entries(items).map(([key, data]) => this.set(key, data, options)));
    }

    async removeMultiple(keys: string[]): Promise<void> {
        await Promise.all(keys.map((key) => this.remove(key)));
    }
}

export const asyncStorage = new AsyncStorage();
