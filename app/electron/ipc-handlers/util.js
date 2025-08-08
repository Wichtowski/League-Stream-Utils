/* eslint-disable @typescript-eslint/no-require-imports */
import { ipcMain, app } from 'electron';
import fs from 'fs';
import path from 'path';
/* eslint-enable @typescript-eslint/no-require-imports */

// File operation lock to prevent concurrent access
const fileLocks = new Map();
const LOCK_TIMEOUT = 5000; // 5 seconds timeout

// Mode switching state to prevent cache clearing during mode switches
let isModeSwitching = false;
let modeSwitchTimeout = null;

function acquireLock(filePath) {
    const lockKey = filePath;
    const now = Date.now();

    // Clean up expired locks
    for (const [key, lock] of fileLocks.entries()) {
        if (now - lock.timestamp > LOCK_TIMEOUT) {
            fileLocks.delete(key);
        }
    }

    if (fileLocks.has(lockKey)) {
        return false; // File is locked
    }

    fileLocks.set(lockKey, { timestamp: now });
    return true;
}

function releaseLock(filePath) {
    fileLocks.delete(filePath);
}

function setModeSwitching(enabled) {
    isModeSwitching = enabled;

    // Clear any existing timeout
    if (modeSwitchTimeout) {
        clearTimeout(modeSwitchTimeout);
        modeSwitchTimeout = null;
    }

    // Set a timeout to automatically disable mode switching after 10 seconds
    if (enabled) {
        modeSwitchTimeout = setTimeout(() => {
            isModeSwitching = false;
            modeSwitchTimeout = null;
        }, 10000);
    }
}

function registerUtilHandlers() {
    ipcMain.handle('get-user-data-path', async () => {
        try {
            return app.getPath('userData');
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-database-path', async () => {
        try {
            const userDataPath = app.getPath('userData');
            return path.join(userDataPath, 'database');
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-mongodb-status', async () => {
        try {
            const { localMongoDBService } = await import('../../src/lib/components/electron/local-mongodb-service.js');
            return await localMongoDBService.getStatus();
        } catch (error) {
            console.error('Failed to get MongoDB status:', error);
            return { isRunning: false, port: 27017 };
        }
    });

    // Database management handlers
    ipcMain.handle('get-database-collections', async () => {
        try {
            const { localDatabaseManager } = await import('../utils/local-database-manager.js');
            return await localDatabaseManager.getCollections();
        } catch (error) {
            console.error('Failed to get database collections:', error);
            return [];
        }
    });

    ipcMain.handle('get-collection-data', async (_event, collectionName, limit = 50) => {
        try {
            const { localDatabaseManager } = await import('../utils/local-database-manager.js');
            return await localDatabaseManager.getCollectionSample(collectionName, limit);
        } catch (error) {
            console.error('Failed to get collection data:', error);
            return [];
        }
    });

    ipcMain.handle('export-collection', async (_event, collectionName) => {
        try {
            const { localDatabaseManager } = await import('../utils/local-database-manager.js');
            return await localDatabaseManager.exportCollection(collectionName);
        } catch (error) {
            console.error('Failed to export collection:', error);
            throw error;
        }
    });

    ipcMain.handle('export-all-data', async () => {
        try {
            const { localDatabaseManager } = await import('../utils/local-database-manager.js');
            return await localDatabaseManager.exportAllData();
        } catch (error) {
            console.error('Failed to export all data:', error);
            throw error;
        }
    });

    ipcMain.handle('create-database-backup', async () => {
        try {
            const { localDatabaseManager } = await import('../utils/local-database-manager.js');
            return await localDatabaseManager.createBackup();
        } catch (error) {
            console.error('Failed to create database backup:', error);
            throw error;
        }
    });

    ipcMain.handle('get-database-backups', async () => {
        try {
            const { localDatabaseManager } = await import('../utils/local-database-manager.js');
            return await localDatabaseManager.getBackups();
        } catch (error) {
            console.error('Failed to get database backups:', error);
            return [];
        }
    });

    ipcMain.handle('restore-backup', async (_event, backupPath) => {
        try {
            const { localDatabaseManager } = await import('../utils/local-database-manager.js');
            return await localDatabaseManager.restoreBackup(backupPath);
        } catch (error) {
            console.error('Failed to restore backup:', error);
            throw error;
        }
    });

    ipcMain.handle('delete-backup', async (_event, backupId) => {
        try {
            const { localDatabaseManager } = await import('../utils/local-database-manager.js');
            return await localDatabaseManager.deleteBackup(backupId);
        } catch (error) {
            console.error('Failed to delete backup:', error);
            throw error;
        }
    });

    ipcMain.handle('open-data-directory', async () => {
        try {
            const { localDatabaseManager } = await import('../utils/local-database-manager.js');
            const { shell } = await import('electron');
            const dataPath = localDatabaseManager.getDataDirectory();
            await shell.openPath(dataPath);
        } catch (error) {
            console.error('Failed to open data directory:', error);
            throw error;
        }
    });

    ipcMain.handle('get-file-size', async (_event, filePath) => {
        if (!acquireLock(filePath)) {
            return {
                success: false,
                error: 'File is currently being accessed by another process'
            };
        }

        try {
            if (!fs.existsSync(filePath)) {
                return { success: false, error: 'File does not exist' };
            }
            const stats = fs.statSync(filePath);
            return { success: true, size: stats.size };
        } catch (error) {
            // Handle EPERM errors specifically
            if (error.code === 'EPERM') {
                return {
                    success: false,
                    error: 'File access denied - file may be in use by another process'
                };
            }
            return { success: false, error: error.message };
        } finally {
            releaseLock(filePath);
        }
    });

    ipcMain.handle('remove-asset', async (_event, filePath) => {
        if (!acquireLock(filePath)) {
            return {
                success: false,
                error: 'File is currently being accessed by another process'
            };
        }

        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return { success: true };
        } catch (error) {
            // Handle EPERM errors specifically
            if (error.code === 'EPERM') {
                return {
                    success: false,
                    error: 'File access denied - file may be in use by another process'
                };
            }
            return { success: false, error: error.message };
        } finally {
            releaseLock(filePath);
        }
    });

    ipcMain.handle('clear-asset-cache', async () => {
        try {
            // Prevent cache clearing during mode switching
            if (isModeSwitching) {
                console.log('Cache clearing blocked during mode switching');
                return {
                    success: false,
                    error: 'Cache clearing blocked during mode switching'
                };
            }

            const userDataPath = app.getPath('userData');
            const assetCachePath = path.join(userDataPath, 'assets', 'cache');

            if (fs.existsSync(assetCachePath)) {
                // Clear all file locks before removing cache
                fileLocks.clear();

                // Use a more robust removal method
                try {
                    fs.rmSync(assetCachePath, { recursive: true, force: true });
                } catch (error) {
                    // If recursive removal fails, try removing files individually
                    if (error.code === 'EPERM' || error.code === 'EBUSY') {
                        console.warn('Recursive cache removal failed, attempting individual file removal...');
                        await removeDirectoryContents(assetCachePath);
                    } else {
                        throw error;
                    }
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error clearing asset cache:', error);
            return { success: false, error: error.message };
        }
    });

    // Helper function to remove directory contents when recursive removal fails
    async function removeDirectoryContents(dirPath) {
        if (!fs.existsSync(dirPath)) return;

        const items = fs.readdirSync(dirPath);
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);

            try {
                if (stat.isDirectory()) {
                    await removeDirectoryContents(fullPath);
                    fs.rmdirSync(fullPath);
                } else {
                    fs.unlinkSync(fullPath);
                }
            } catch (error) {
                console.warn(`Failed to remove ${fullPath}:`, error.message);
                // Continue with other files even if one fails
            }
        }
    }

    ipcMain.handle('check-asset-integrity', async () => {
        try {
            const userDataPath = app.getPath('userData');
            const assetCachePath = path.join(userDataPath, 'assets', 'cache');

            if (!fs.existsSync(assetCachePath)) {
                return {
                    success: true,
                    integrity: {
                        isValid: true,
                        missingFiles: [],
                        corruptedFiles: [],
                        totalFiles: 0,
                        validFiles: 0,
                        message: 'No asset cache found'
                    }
                };
            }

            const categories = ['champions', 'items', 'game-ui', 'runes', 'spells'];
            const missingFiles = [];
            const corruptedFiles = [];
            let totalFiles = 0;
            let validFiles = 0;

            for (const category of categories) {
                const categoryPath = path.join(assetCachePath, category);
                if (!fs.existsSync(categoryPath)) continue;

                const manifestPath = path.join(assetCachePath, `${category}-manifest.json`);
                const expectedFiles = fs.existsSync(manifestPath)
                    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
                    : {};

                // Scan actual files in the category directory
                const actualFiles = new Set();
                function scanDirectory(dirPath, relativePath = '') {
                    if (!fs.existsSync(dirPath)) return;

                    try {
                        const items = fs.readdirSync(dirPath);
                        for (const item of items) {
                            const fullPath = path.join(dirPath, item);

                            try {
                                const stat = fs.statSync(fullPath);

                                if (stat.isDirectory()) {
                                    scanDirectory(fullPath, path.join(relativePath, item));
                                } else if (stat.isFile()) {
                                    const fileKey = path.join(relativePath, item);
                                    actualFiles.add(fileKey);
                                    totalFiles++;

                                    // Check if file is corrupted (0 bytes or unreadable)
                                    if (stat.size === 0) {
                                        corruptedFiles.push(`${category}/${fileKey}`);
                                    } else {
                                        validFiles++;
                                    }
                                }
                            } catch (error) {
                                // Handle EPERM errors gracefully
                                if (error.code === 'EPERM') {
                                    console.warn(`Skipping file ${fullPath} due to access error:`, error.message);
                                    corruptedFiles.push(`${category}/${path.join(relativePath, item)}`);
                                } else {
                                    console.error(`Error accessing file ${fullPath}:`, error);
                                }
                            }
                        }
                    } catch (error) {
                        // Handle EPERM errors for directory access
                        if (error.code === 'EPERM') {
                            console.warn(`Skipping directory ${dirPath} due to access error:`, error.message);
                        } else {
                            console.error(`Error scanning directory ${dirPath}:`, error);
                        }
                    }
                }

                scanDirectory(categoryPath);

                // Check for missing files (expected but not found)
                for (const [fileKey, _fileInfo] of Object.entries(expectedFiles)) {
                    if (!actualFiles.has(fileKey)) {
                        missingFiles.push(`${category}/${fileKey}`);
                    }
                }
            }

            const isValid = missingFiles.length === 0 && corruptedFiles.length === 0;
            const message = isValid
                ? `All ${validFiles} files are valid`
                : `Found ${missingFiles.length} missing and ${corruptedFiles.length} corrupted files out of ${totalFiles} total`;

            return {
                success: true,
                integrity: {
                    isValid,
                    missingFiles,
                    corruptedFiles,
                    totalFiles,
                    validFiles,
                    message
                }
            };
        } catch (error) {
            console.error('Error checking asset integrity:', error);
            return {
                success: false,
                error: error.message,
                integrity: {
                    isValid: false,
                    missingFiles: [],
                    corruptedFiles: [],
                    totalFiles: 0,
                    validFiles: 0,
                    message: `Error checking integrity: ${error.message}`
                }
            };
        }
    });

    // Add a new handler to pause background processes during mode switches
    ipcMain.handle('pause-background-processes', async () => {
        try {
            // Clear all file locks to prevent new operations
            fileLocks.clear();

            // Give a small delay to allow current operations to complete
            await new Promise((resolve) => setTimeout(resolve, 100));

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Add a handler to resume background processes
    ipcMain.handle('resume-background-processes', async () => {
        try {
            // Clear any stale locks
            const now = Date.now();
            for (const [key, lock] of fileLocks.entries()) {
                if (now - lock.timestamp > LOCK_TIMEOUT) {
                    fileLocks.delete(key);
                }
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Add handlers to control mode switching state
    ipcMain.handle('set-mode-switching', async (_event, enabled) => {
        try {
            setModeSwitching(enabled);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-mode-switching-state', async () => {
        try {
            return { success: true, isModeSwitching };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

export { registerUtilHandlers };
