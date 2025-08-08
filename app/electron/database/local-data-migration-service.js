import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export class LocalDataMigrationService {
    constructor() {
        this.userDataPath = app.getPath('userData');
        this.localStoragePath = path.join(this.userDataPath, 'localStorage');
    }

    async checkForLocalStorageData() {
        try {
            if (!fs.existsSync(this.localStoragePath)) {
                return false;
            }

            const files = fs.readdirSync(this.localStoragePath);
            return files.some((file) => file.endsWith('.json'));
        } catch (error) {
            console.error('Error checking for localStorage data:', error);
            return false;
        }
    }

    async getMigrationStatus() {
        const localStorageDataFound = await this.checkForLocalStorageData();

        const statusFile = path.join(this.userDataPath, 'migration-status.json');

        if (!fs.existsSync(statusFile)) {
            return {
                localStorageDataFound,
                migrationStatus: localStorageDataFound ? 'pending' : 'complete',
                migratedCollections: []
            };
        }

        try {
            const statusData = fs.readFileSync(statusFile, 'utf8');
            return JSON.parse(statusData);
        } catch (_error) {
            return {
                localStorageDataFound,
                migrationStatus: 'error',
                error: 'Failed to read migration status',
                migratedCollections: []
            };
        }
    }

    async updateMigrationStatus(status) {
        const currentStatus = await this.getMigrationStatus();
        const newStatus = { ...currentStatus, ...status };

        const statusFile = path.join(this.userDataPath, 'migration-status.json');
        fs.writeFileSync(statusFile, JSON.stringify(newStatus, null, 2));
    }

    async migrateDataToMongoDB() {
        try {
            await this.updateMigrationStatus({ migrationStatus: 'in-progress' });

            if (!fs.existsSync(this.localStoragePath)) {
                await this.updateMigrationStatus({
                    migrationStatus: 'complete',
                    migratedCollections: []
                });
                return;
            }

            const files = fs.readdirSync(this.localStoragePath);
            const jsonFiles = files.filter((file) => file.endsWith('.json'));

            const migratedCollections = [];

            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(this.localStoragePath, file);
                    const data = fs.readFileSync(filePath, 'utf8');
                    const parsedData = JSON.parse(data);

                    // Here you would insert the data into MongoDB
                    // This is a placeholder - you'll need to implement the actual MongoDB insertion
                    console.log(`Migrating ${file} with ${Object.keys(parsedData).length} records`);

                    migratedCollections.push(file.replace('.json', ''));
                } catch (error) {
                    console.error(`Error migrating ${file}:`, error);
                }
            }

            // Clear localStorage after successful migration
            if (migratedCollections.length > 0) {
                fs.rmSync(this.localStoragePath, { recursive: true, force: true });
            }

            await this.updateMigrationStatus({
                migrationStatus: 'complete',
                migratedCollections
            });
        } catch (error) {
            await this.updateMigrationStatus({
                migrationStatus: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    async clearMigrationStatus() {
        const statusFile = path.join(this.userDataPath, 'migration-status.json');
        if (fs.existsSync(statusFile)) {
            fs.unlinkSync(statusFile);
        }
    }
}

export const localDataMigrationService = new LocalDataMigrationService();
