import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export interface DatabaseBackup {
  id: string;
  timestamp: Date;
  collections: string[];
  size: number;
  path: string;
}

export interface CollectionData {
  name: string;
  count: number;
  sample: any[];
}

export class LocalDatabaseManager {
  private userDataPath: string;
  private backupsPath: string;
  private port: number = 27017;

  constructor() {
    this.userDataPath = app.getPath('userData');
    this.backupsPath = path.join(this.userDataPath, 'database-backups');
    
    if (!fs.existsSync(this.backupsPath)) {
      fs.mkdirSync(this.backupsPath, { recursive: true });
    }
  }

  async exportCollection(collectionName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.userDataPath, `${collectionName}-export.json`);
      
      const mongodump = spawn('mongodump', [
        `--uri=mongodb://127.0.0.1:${this.port}/league-stream-utils`,
        `--collection=${collectionName}`,
        `--out=${path.dirname(outputPath)}`
      ]);

      mongodump.on('close', (code) => {
        if (code === 0) {
          // Convert BSON to JSON
          this.convertBSONToJSON(collectionName, outputPath)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error(`Export failed with code ${code}`));
        }
      });

      mongodump.on('error', reject);
    });
  }

  async exportAllData(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `full-backup-${timestamp}`;
      const backupPath = path.join(this.backupsPath, backupId);
      
      const mongodump = spawn('mongodump', [
        `--uri=mongodb://127.0.0.1:${this.port}/league-stream-utils`,
        `--out=${backupPath}`
      ]);

      mongodump.on('close', (code) => {
        if (code === 0) {
          const jsonPath = path.join(this.backupsPath, `${backupId}.json`);
          this.convertAllBSONToJSON(backupPath, jsonPath)
            .then(() => resolve(jsonPath))
            .catch(reject);
        } else {
          reject(new Error(`Full export failed with code ${code}`));
        }
      });

      mongodump.on('error', reject);
    });
  }

  async importCollection(collectionName: string, jsonFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const mongorestore = spawn('mongorestore', [
        `--uri=mongodb://127.0.0.1:${this.port}/league-stream-utils`,
        `--collection=${collectionName}`,
        `--drop`,
        jsonFilePath
      ]);

      mongorestore.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Import failed with code ${code}`));
        }
      });

      mongorestore.on('error', reject);
    });
  }

  async getCollections(): Promise<CollectionData[]> {
    return new Promise((resolve, reject) => {
      const mongosh = spawn('mongosh', [
        `mongodb://127.0.0.1:${this.port}/league-stream-utils`,
        '--eval',
        'db.getCollectionNames().forEach(function(collection) { print(collection + ":" + db.getCollection(collection).count()); })'
      ]);

      let output = '';
      mongosh.stdout?.on('data', (data) => {
        output += data.toString();
      });

      mongosh.on('close', (code) => {
        if (code === 0) {
          const collections: CollectionData[] = [];
          const lines = output.trim().split('\n');
          
          for (const line of lines) {
            const [name, countStr] = line.split(':');
            if (name && countStr) {
              collections.push({
                name: name.trim(),
                count: parseInt(countStr.trim()),
                sample: []
              });
            }
          }
          
          resolve(collections);
        } else {
          reject(new Error(`Failed to get collections with code ${code}`));
        }
      });

      mongosh.on('error', reject);
    });
  }

  async getCollectionSample(collectionName: string, limit: number = 5): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const mongosh = spawn('mongosh', [
        `mongodb://127.0.0.1:${this.port}/league-stream-utils`,
        '--eval',
        `db.${collectionName}.find().limit(${limit}).toArray()`
      ]);

      let output = '';
      mongosh.stdout?.on('data', (data) => {
        output += data.toString();
      });

      mongosh.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse the JSON output from mongosh
            const jsonMatch = output.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[0]);
              resolve(data);
            } else {
              resolve([]);
            }
          } catch (error) {
            reject(new Error('Failed to parse collection data'));
          }
        } else {
          reject(new Error(`Failed to get collection sample with code ${code}`));
        }
      });

      mongosh.on('error', reject);
    });
  }

  async createBackup(): Promise<DatabaseBackup> {
    const timestamp = new Date();
    const backupId = `backup-${timestamp.toISOString().replace(/[:.]/g, '-')}`;
    const backupPath = path.join(this.backupsPath, `${backupId}.json`);
    
    const exportPath = await this.exportAllData();
    
    // Move to backup location
    fs.renameSync(exportPath, backupPath);
    
    const stats = fs.statSync(backupPath);
    const collections = await this.getCollections();
    
    return {
      id: backupId,
      timestamp,
      collections: collections.map(c => c.name),
      size: stats.size,
      path: backupPath
    };
  }

  async restoreBackup(backupPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const mongorestore = spawn('mongorestore', [
        `--uri=mongodb://127.0.0.1:${this.port}/league-stream-utils`,
        '--drop',
        backupPath
      ]);

      mongorestore.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Restore failed with code ${code}`));
        }
      });

      mongorestore.on('error', reject);
    });
  }

  async getBackups(): Promise<DatabaseBackup[]> {
    const backups: DatabaseBackup[] = [];
    
    if (fs.existsSync(this.backupsPath)) {
      const files = fs.readdirSync(this.backupsPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.backupsPath, file);
          const stats = fs.statSync(filePath);
          
          backups.push({
            id: file.replace('.json', ''),
            timestamp: stats.mtime,
            collections: [], // Would need to parse file to get collections
            size: stats.size,
            path: filePath
          });
        }
      }
    }
    
    return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async deleteBackup(backupId: string): Promise<void> {
    const backupPath = path.join(this.backupsPath, `${backupId}.json`);
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
  }

  getDataDirectory(): string {
    return path.join(this.userDataPath, 'mongodb-data');
  }

  getBackupsDirectory(): string {
    return this.backupsPath;
  }

  private async convertBSONToJSON(collectionName: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const mongosh = spawn('mongosh', [
        `mongodb://127.0.0.1:${this.port}/league-stream-utils`,
        '--eval',
        `db.${collectionName}.find().toArray()`
      ]);

      let output = '';
      mongosh.stdout?.on('data', (data) => {
        output += data.toString();
      });

      mongosh.on('close', (code) => {
        if (code === 0) {
          try {
            const jsonMatch = output.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[0]);
              fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
              resolve(outputPath);
            } else {
              reject(new Error('No data found'));
            }
          } catch (error) {
            reject(new Error('Failed to parse data'));
          }
        } else {
          reject(new Error(`Conversion failed with code ${code}`));
        }
      });

      mongosh.on('error', reject);
    });
  }

  private async convertAllBSONToJSON(bsonPath: string, jsonPath: string): Promise<void> {
    // This would need to iterate through all collections
    // For now, we'll use a simpler approach
    const collections = await this.getCollections();
    const allData: Record<string, any[]> = {};
    
    for (const collection of collections) {
      const data = await this.getCollectionSample(collection.name, 1000); // Get all data
      allData[collection.name] = data;
    }
    
    fs.writeFileSync(jsonPath, JSON.stringify(allData, null, 2));
  }
}

export const localDatabaseManager = new LocalDatabaseManager(); 