import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export class LocalDatabaseManager {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.dataDirectory = path.join(this.userDataPath, 'mongodb-data');
    this.backupsDirectory = path.join(this.userDataPath, 'mongodb-backups');
    
    // Ensure directories exist
    if (!fs.existsSync(this.dataDirectory)) {
      fs.mkdirSync(this.dataDirectory, { recursive: true });
    }
    if (!fs.existsSync(this.backupsDirectory)) {
      fs.mkdirSync(this.backupsDirectory, { recursive: true });
    }
  }

  async getCollections() {
    try {
      const result = await this.runMongoCommand('show collections');
      return result.split('\n').filter(line => line.trim() && !line.includes('---'));
    } catch (error) {
      console.error('Error getting collections:', error);
      return [];
    }
  }

  async getCollectionSample(collectionName, limit = 10) {
    try {
      const command = `db.${collectionName}.find().limit(${limit}).toArray()`;
      const result = await this.runMongoCommand(command);
      return JSON.parse(result);
    } catch (error) {
      console.error(`Error getting sample from ${collectionName}:`, error);
      return [];
    }
  }

  async exportCollection(collectionName, outputPath) {
    try {
      const args = [
        `mongodb://127.0.0.1:27017/league-stream-utils`,
        '--collection', collectionName,
        '--out', outputPath
      ];
      
      await this.runCommand('mongodump', args);
      return { success: true, path: outputPath };
    } catch (error) {
      console.error(`Error exporting collection ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  async exportAllData(outputPath) {
    try {
      const args = [
        `mongodb://127.0.0.1:27017/league-stream-utils`,
        '--out', outputPath
      ];
      
      await this.runCommand('mongodump', args);
      return { success: true, path: outputPath };
    } catch (error) {
      console.error('Error exporting all data:', error);
      return { success: false, error: error.message };
    }
  }

  async importCollection(collectionName, inputPath) {
    try {
      const args = [
        `mongodb://127.0.0.1:27017/league-stream-utils`,
        '--collection', collectionName,
        '--file', inputPath
      ];
      
      await this.runCommand('mongoimport', args);
      return { success: true };
    } catch (error) {
      console.error(`Error importing collection ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  async createBackup(backupName) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupsDirectory, `${backupName}_${timestamp}`);
      
      const result = await this.exportAllData(backupPath);
      if (result.success) {
        return { success: true, path: backupPath, name: backupName };
      } else {
        return result;
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      return { success: false, error: error.message };
    }
  }

  async restoreBackup(backupPath) {
    try {
      const args = [
        `mongodb://127.0.0.1:27017/league-stream-utils`,
        '--dir', backupPath
      ];
      
      await this.runCommand('mongorestore', args);
      return { success: true };
    } catch (error) {
      console.error('Error restoring backup:', error);
      return { success: false, error: error.message };
    }
  }

  async getBackups() {
    try {
      const files = fs.readdirSync(this.backupsDirectory);
      return files
        .filter(file => fs.statSync(path.join(this.backupsDirectory, file)).isDirectory())
        .map(file => ({
          name: file,
          path: path.join(this.backupsDirectory, file),
          created: fs.statSync(path.join(this.backupsDirectory, file)).birthtime
        }))
        .sort((a, b) => b.created - a.created);
    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  }

  async deleteBackup(backupPath) {
    try {
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
        return { success: true };
      } else {
        return { success: false, error: 'Backup not found' };
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      return { success: false, error: error.message };
    }
  }

  getDataDirectory() {
    return this.dataDirectory;
  }

  getBackupsDirectory() {
    return this.backupsDirectory;
  }

  async runMongoCommand(command) {
    const args = [
      `mongodb://127.0.0.1:27017/league-stream-utils`,
      '--eval', command,
      '--quiet'
    ];
    
    return await this.runCommand('mongosh', args);
  }

  async runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: 'pipe',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}

export const localDatabaseManager = new LocalDatabaseManager(); 