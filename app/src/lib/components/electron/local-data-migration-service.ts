// This file is for TypeScript types only
// The actual implementation is in electron/utils/local-data-migration-service.js

export interface MigrationStatus {
    localStorageDataFound: boolean;
    migrationStatus: 'pending' | 'in-progress' | 'complete' | 'error';
    error?: string;
    migratedCollections: string[];
}

export interface LocalDataMigrationService {
    checkForLocalStorageData(): Promise<boolean>;
    getMigrationStatus(): Promise<MigrationStatus>;
    updateMigrationStatus(status: Partial<MigrationStatus>): Promise<void>;
    migrateDataToMongoDB(): Promise<void>;
    clearMigrationStatus(): Promise<void>;
}
