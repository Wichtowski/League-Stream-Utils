# Persistent MongoDB Setup

## Overview

The League Stream Utils Electron app now uses MongoDB Memory Server with persistent storage to store all application data in the user's %appdata% directory. This ensures that all team, tournament, and other data persists between app sessions and is stored locally on the user's PC.

## How It Works

### MongoDB Memory Server with Persistent Storage

Instead of using purely in-memory storage, the application now configures MongoDB Memory Server to use a persistent data directory:

- **Data Location**: `%APPDATA%/League Stream Utils/mongodb-data/`
- **Storage Engine**: WiredTiger (MongoDB's default storage engine)
- **Persistence**: All data is automatically saved to disk and persists between app sessions

### Automatic Migration from localStorage

When the app starts in local data mode, it automatically:

1. **Checks for existing localStorage data** (teams, tournaments, users, game sessions)
2. **Migrates data to MongoDB** if localStorage data is found
3. **Clears localStorage** after successful migration
4. **Continues using MongoDB** for all future data operations

## Data Storage Locations

### Primary Data Storage
- **MongoDB Data**: `%APPDATA%/League Stream Utils/mongodb-data/`
  - Contains all application data in MongoDB binary format
  - Automatically managed by MongoDB Memory Server
  - Persists between app sessions and system restarts

### Backup Storage
- **Database Backups**: `%APPDATA%/League Stream Utils/database-backups/`
  - JSON exports of your data for backup/restore purposes
  - Human-readable format for easy inspection
  - Can be used to restore data or transfer between systems

### Other Assets
- **Application Assets**: `%APPDATA%/League Stream Utils/assets/`
  - Cached images, logos, and media files
- **Champion Data**: `%APPDATA%/League Stream Utils/champions/`
  - Cached champion information and images

## Migration Process

### Automatic Migration
The migration happens automatically when:
- The app starts in local data mode
- Existing localStorage data is detected
- MongoDB is successfully started

### Manual Migration
You can also trigger migration manually:
1. Go to **Settings** in the app
2. Look for the **Data Migration Status** section
3. Click **"Migrate to MongoDB"** if localStorage data is detected

### Migration Status
The migration status shows:
- **localStorage Data Found**: Whether existing data was detected
- **Migration Status**: Current state (Pending, In Progress, Complete)
- **Migration Results**: Success/failure with detailed error messages

## Benefits

### ✅ Data Persistence
- All data persists between app sessions
- Data survives app crashes and system restarts
- No data loss when closing the app

### ✅ Better Performance
- MongoDB provides better query performance than localStorage
- Supports complex queries and indexing
- More efficient for large datasets

### ✅ Data Integrity
- MongoDB's journaling ensures data consistency
- Automatic backup and restore capabilities
- Better error handling and recovery

### ✅ Scalability
- Can handle larger amounts of data
- Supports complex data relationships
- Better for future feature expansion

## Technical Details

### MongoDB Configuration
```typescript
// MongoDB Memory Server with persistent storage
this.mongoServer = await MongoMemoryServer.create({
  instance: {
    port: 27017,
    dbName: 'league-stream-utils',
    storageEngine: 'wiredTiger',
    args: [
      '--dbpath', this.dataDirectory,
      '--storageEngine', 'wiredTiger'
    ]
  },
  binary: {
    version: '7.0.0'
  }
});
```

### Data Models

The application uses Mongoose models for data management:

- **UserModel**: User accounts and authentication
- **TeamModel**: Team information and rosters
- **TournamentModel**: Tournament configurations and brackets
- **GameSessionModel**: Active game sessions and pick/ban data

### Migration Service

The `LocalDataMigrationService` (located in `app/electron/utils/`) handles:

- Detection of existing localStorage data
- Migration of data to MongoDB collections
- Duplicate prevention during migration
- Error handling and reporting

## Application Structure

The local MongoDB services are organized in the Electron-specific directory structure:

```text
app/
├── electron/
│   ├── utils/
│   │   ├── local-mongodb-service.ts      # MongoDB Memory Server management
│   │   ├── local-database-manager.ts     # Database operations and backups
│   │   └── local-data-migration-service.ts # localStorage to MongoDB migration
│   ├── ipc-handlers/
│   │   └── util.js                       # IPC handlers for database operations
│   └── main.js                           # Main Electron process
└── src/
    ├── lib/
    │   ├── database/
    │   │   └── connection.ts             # Database connection (imports MongoDB service)
    │   └── contexts/
    │       └── ElectronContext.tsx       # Electron context (imports migration service)
    └── app/
        └── api/v1/migration/
            └── route.ts                  # Migration API endpoint
```

## Troubleshooting

### Migration Issues
If migration fails:
1. Check the console for error messages
2. Verify MongoDB is running properly
3. Try manual migration from Settings
4. Check available disk space in %appdata%

### Data Access Issues

If data isn't loading:

1. Verify local data mode is enabled
2. Check MongoDB connection status
3. Restart the application
4. Check for database corruption

### Performance Issues
If the app is slow:
1. Check available system resources
2. Verify MongoDB is running efficiently
3. Consider clearing old backup files
4. Restart the application

## Backup and Restore

### Creating Backups
1. Go to **Settings → Database Manager**
2. Click **"Create Backup"**
3. Backup will be saved as JSON in the backups directory

### Restoring Backups
1. Go to **Settings → Database Manager**
2. Select a backup from the list
3. Click **"Restore Backup"**
4. Confirm the restoration

### Manual Backup Location
Backups are stored in: `%APPDATA%/League Stream Utils/database-backups/`

## Future Enhancements

- **Incremental Backups**: Automatic periodic backups
- **Cloud Sync**: Optional cloud backup integration
- **Data Compression**: Compressed backup storage
- **Migration Tools**: Enhanced migration utilities
- **Performance Monitoring**: Database performance metrics
