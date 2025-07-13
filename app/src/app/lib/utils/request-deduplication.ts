interface PendingRequest {
    promise: Promise<unknown>;
    timestamp: number;
}

class RequestDeduplication {
    private pendingRequests = new Map<string, PendingRequest>();
    private readonly CACHE_DURATION = 5000; // 5 seconds

    async deduplicate<T>(
        key: string,
        requestFn: () => Promise<T>,
        options?: { cacheDuration?: number }
    ): Promise<T> {
        const cacheDuration = options?.cacheDuration || this.CACHE_DURATION;
        const now = Date.now();

        // Check if there's a pending request
        const pending = this.pendingRequests.get(key);
        if (pending && (now - pending.timestamp) < cacheDuration) {
            return pending.promise as Promise<T>;
        }

        // Create new request
        const promise = requestFn().finally(() => {
            // Clean up after request completes
            setTimeout(() => {
                this.pendingRequests.delete(key);
            }, cacheDuration);
        });

        // Store the pending request
        this.pendingRequests.set(key, {
            promise,
            timestamp: now
        });

        return promise;
    }

    clear(): void {
        this.pendingRequests.clear();
    }

    getPendingCount(): number {
        return this.pendingRequests.size;
    }
}

export const requestDeduplication = new RequestDeduplication(); 