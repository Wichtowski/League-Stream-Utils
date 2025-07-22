interface QueuedRequest<T> {
    id: string;
    requestFn: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
    priority: number;
    timestamp: number;
    timeoutId?: NodeJS.Timeout;
}

class RequestQueue {
    private queue: QueuedRequest<unknown>[] = [];
    private processing = false;
    private maxConcurrent = 3;
    private activeRequests = 0;
    private requestTimeout = 30000; // 30 seconds

    async enqueue<T>(
        requestFn: () => Promise<T>,
        options?: {
            priority?: number;
            timeout?: number;
            id?: string;
        }
    ): Promise<T> {
        const id = options?.id || Math.random().toString(36).substr(2, 9);
        const priority = options?.priority || 0;
        const timeout = options?.timeout || this.requestTimeout;

        return new Promise<T>((resolve, reject) => {
            const queuedRequest: QueuedRequest<T> = {
                id,
                requestFn,
                resolve,
                reject,
                priority,
                timestamp: Date.now()
            };

            // Add to queue and sort by priority (higher priority first)
            this.queue.push(queuedRequest as QueuedRequest<unknown>);
            this.queue.sort((a, b) => b.priority - a.priority);

            // Set timeout for the request
            const timeoutId = setTimeout(() => {
                this.removeFromQueue(id);
                reject(new Error(`Request timeout after ${timeout}ms`));
            }, timeout);

            // Store timeout ID for cleanup
            queuedRequest.timeoutId = timeoutId;

            // Process queue if not already processing
            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
            const request = this.queue.shift();
            if (!request) continue;

            this.activeRequests++;

            // Clear timeout since we're processing
            if (request.timeoutId) {
                clearTimeout(request.timeoutId);
            }

            try {
                const result = await request.requestFn();
                request.resolve(result);
            } catch (error) {
                request.reject(error);
            } finally {
                this.activeRequests--;
            }

            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        this.processing = false;

        // If there are still items in queue and we can process more, continue
        if (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
            this.processQueue();
        }
    }

    private removeFromQueue(id: string): void {
        const index = this.queue.findIndex(req => req.id === id);
        if (index !== -1) {
            const request = this.queue[index];
            if (request.timeoutId) {
                clearTimeout(request.timeoutId);
            }
            this.queue.splice(index, 1);
        }
    }

    clear(): void {
        this.queue.forEach(request => {
            if (request.timeoutId) {
                clearTimeout(request.timeoutId);
            }
            request.reject(new Error('Queue cleared'));
        });
        this.queue = [];
        this.processing = false;
        this.activeRequests = 0;
    }

    getQueueLength(): number {
        return this.queue.length;
    }

    getActiveRequests(): number {
        return this.activeRequests;
    }

    setMaxConcurrent(max: number): void {
        this.maxConcurrent = Math.max(1, max);
    }
}

export const requestQueue = new RequestQueue(); 