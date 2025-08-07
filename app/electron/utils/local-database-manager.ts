import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { MongoClient, Db, Document } from 'mongodb';
import { localMongoDBService } from './local-mongodb-service';

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
  sample: Document[];
}

export class LocalDatabaseManager {
  private userDataPath: string;
  private backupsPath: string;
  private port: number = 27017;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  constructor() {
    this.userDataPath = app.getPath('userData');
    this.backupsPath = path.join(this.userDataPath, 'database-backups');
    
    if (!fs.existsSync(this.backupsPath)) {
      fs.mkdirSync(this.backupsPath, { recursive: true });
    }
  }

  private async getConnection(): Promise<{ client: MongoClient; db: Db }> {
    if (!this.client || !this.db) {
      const connectionString = localMongoDBService.getConnectionString();
      this.client = new MongoClient(connectionString);
      await this.client.connect();
      this.db = this.client.db('league-stream-utils');
    }
    return { client: this.client, db: this.db };
  }

  async exportCollection(collectionName: string): Promise<string> {
    const { db } = await this.getConnection();
    const outputPath = path.join(this.userDataPath, `${collectionName}-export.json`);
    
    const collection = db.collection(collectionName);
    const documents = await collection.find({}).toArray();
    
    fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2));
    return outputPath;
  }

  async exportAllData(): Promise<string> {
    const { db } = await this.getConnection();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `full-backup-${timestamp}`;
    const backupPath = path.join(this.backupsPath, `${backupId}.json`);
    
    const collections = await db.listCollections().toArray();
    const allData: Record<string, Document[]> = {};
    
    for (const collection of collections) {
      const documents = await db.collection(collection.name).find({}).toArray();
      allData[collection.name] = documents;
    }
    
    fs.writeFileSync(backupPath, JSON.stringify(allData, null, 2));
    return backupPath;
  }

  async importCollection(collectionName: string, jsonFilePath: string): Promise<void> {
    const { db } = await this.getConnection();
    
    const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    const collection = db.collection(collectionName);
    
    // Clear existing data
    await collection.deleteMany({});
    
    // Insert new data
    if (Array.isArray(data) && data.length > 0) {
      await collection.insertMany(data);
    }
  }

  async getCollections(): Promise<CollectionData[]> {
    const { db } = await this.getConnection();
    const collections: CollectionData[] = [];
    
    const collectionList = await db.listCollections().toArray();
    
    for (const collection of collectionList) {
      const count = await db.collection(collection.name).countDocuments();
      const sample = await db.collection(collection.name).find({}).limit(5).toArray();
      
      collections.push({
        name: collection.name,
        count,
        sample
      });
    }
    
    return collections;
  }

  async getCollectionSample(collectionName: string, limit: number = 5): Promise<Document[]> {
    const { db } = await this.getConnection();
    const collection = db.collection(collectionName);
    return await collection.find({}).limit(limit).toArray();
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
    const { db } = await this.getConnection();
    
    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    for (const [collectionName, documents] of Object.entries(data)) {
      const collection = db.collection(collectionName);
      
      // Clear existing data
      await collection.deleteMany({});
      
      // Insert backup data
      if (Array.isArray(documents) && documents.length > 0) {
        await collection.insertMany(documents);
      }
    }
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
    return localMongoDBService.getDataDirectory();
  }

  getBackupsDirectory(): string {
    return this.backupsPath;
  }

  async closeConnection(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}

export const localDatabaseManager = new LocalDatabaseManager();
