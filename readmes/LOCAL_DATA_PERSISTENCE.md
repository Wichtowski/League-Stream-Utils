# Local Data Persistence

## Overview

The League Stream Utils Electron app stores all local data persistently, meaning your data is preserved between app sessions and can be accessed even when the app is closed.

## Data Storage Locations

### MongoDB Data
- **Location**: `%APPDATA%/League Stream Utils/mongodb-data/` (Windows)
- **Purpose**: Stores all application data (teams, tournaments, matches, users, etc.)
- **Format**: MongoDB binary files (not directly editable)

### Assets
- **Location**: `%APPDATA%/League Stream Utils/assets/`
- **Purpose**: Cached images, logos, and other media files
- **Format**: Standard image files (PNG, JPG, etc.)

### Backups
- **Location**: `%APPDATA%/League Stream Utils/database-backups/`
- **Purpose**: JSON exports of your data for backup/restore
- **Format**: Human-readable JSON files

## Data Persistence

### ✅ Data Persists When:
- Closing the app normally
- Restarting your computer
- Updating the application
- Switching between local and online data modes

### ❌ Data is NOT Lost When:
- The app crashes (data is saved immediately)
- Power loss (MongoDB uses journaling for data integrity)
- App updates (data directories are preserved)

## Database Manager

Access the Database Manager from **Settings → Database Manager** in the Electron app.

### Features:

#### 📊 Collections Browser
- View all database collections (teams, tournaments, matches, etc.)
- See document counts for each collection
- Browse sample data from each collection

#### 💾 Backup & Restore
- **Create Backup**: Export all data to a timestamped JSON file
- **Restore Backup**: Replace current data with a previous backup
- **Delete Backup**: Remove old backup files to save space

#### 📤 Export/Import
- **Export Collection**: Save a specific collection as JSON
- **Export All Data**: Create a complete backup of all data
- **Import Data**: Restore data from JSON files

#### 📁 File Access
- **Open Data Directory**: Opens the MongoDB data folder in File Explorer
- **Direct File Access**: All data files are accessible through your file system

## Manual Data Management

### Viewing Data Files
1. Open **Settings → Database Manager**
2. Click **"Open Data Directory"**
3. Navigate to the `mongodb-data` folder
4. **Note**: MongoDB files are binary and not directly editable

### Editing Data
1. **Export** the data you want to edit as JSON
2. **Edit** the JSON file with any text editor
3. **Import** the modified JSON back to the database

### Backup Strategy
- **Automatic**: Create backups before major changes
- **Manual**: Export data regularly for safekeeping
- **Cloud**: Copy backup JSON files to cloud storage

## Data Safety

### Built-in Protection
- **Journaling**: MongoDB automatically logs all changes
- **Atomic Operations**: Data is never left in an inconsistent state
- **Error Recovery**: Failed operations are automatically rolled back

### Best Practices
1. **Regular Backups**: Create backups before major changes
2. **Test Restores**: Periodically test backup restoration
3. **Multiple Copies**: Keep backups in different locations
4. **Version Control**: Use descriptive names for backup files

## Troubleshooting

### Data Not Appearing
- Check if you're in **Local Data Mode** (Settings → Data Storage)
- Verify MongoDB is running (Settings → Database Manager shows status)
- Try refreshing the page or restarting the app

### Backup Issues
- Ensure you have write permissions to the app data directory
- Check available disk space
- Verify the backup file is not corrupted

### Performance Issues
- Large datasets may slow down the database manager
- Consider exporting and deleting old data
- Restart the app if MongoDB becomes unresponsive

## File Locations by OS

### Windows
```
%APPDATA%/League Stream Utils/
├── mongodb-data/          # Database files
├── assets/               # Cached assets
├── database-backups/     # Backup files
└── champions/           # Champion data
```

### macOS
```
~/Library/Application Support/League Stream Utils/
├── mongodb-data/
├── assets/
├── database-backups/
└── champions/
```

### Linux
```
~/.config/League Stream Utils/
├── mongodb-data/
├── assets/
├── database-backups/
└── champions/
```

## Migration

### Moving Data Between Computers
1. **Export** all data from the source computer
2. **Copy** the backup JSON files to the target computer
3. **Import** the data on the target computer
4. **Copy** the `assets` folder for cached images

### Upgrading the App
- Data is automatically preserved during app updates
- No manual migration required
- Backups are recommended before major version updates 