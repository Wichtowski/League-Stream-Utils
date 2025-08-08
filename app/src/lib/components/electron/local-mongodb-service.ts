// This file is for TypeScript types only
// The actual implementation is in electron/utils/local-mongodb-service.js

export interface LocalMongoDBStatus {
    isRunning: boolean;
    port: number;
    pid?: number;
}

export interface LocalMongoDBService {
    start(): Promise<void>;
    stop(): Promise<void>;
    getStatus(): Promise<LocalMongoDBStatus>;
    getConnectionString(): string;
    getDataDirectory(): string;
    waitForReady(): Promise<void>;
    clearData(): Promise<void>;
    backupData(backupPath: string): Promise<void>;
    restoreData(backupPath: string): Promise<void>;
}
