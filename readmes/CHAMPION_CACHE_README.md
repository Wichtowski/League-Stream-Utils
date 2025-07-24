# Champion Caching System

This document describes the comprehensive champion caching system inspired by LeagueBroadcast, which downloads and organizes champion data locally for improved performance and offline access.

## Overview

The champion caching system downloads champion data from Riot's DataDragon API and stores it locally in a structured format similar to LeagueBroadcast. This includes:

- Champion basic information (ID, name, key, stats)
- Champion images (splash, splash centered, loading, square)
- Ability icons for all spells and passive
- Organized folder structure by version and champion

## Directory Structure

The cache is stored in the user's app data directory under `cache/champion`:

```
champion-cache/
├── game/
│   └── {version}/
│       └── champion/
│           ├── Aatrox/
│           │   ├── data.json
│           │   ├── Aatrox_0.jpg (splash)
│           │   ├── Aatrox_0.jpg (splash centered)
│           │   ├── Aatrox_0.jpg (loading)
│           │   ├── Aatrox.png (square)
│           │   └── abilities/
│           │       ├── aatroxq.png
│           │       ├── aatroxw.png
│           │       ├── aatroxe.png
│           │       ├── aatroxr.png
│           │       └── aatrox_passive.png
│           ├── Ahri/
│           └── ...
```

## Features

### Automatic Version Detection
- Fetches the latest DataDragon version automatically
- Supports multiple versions simultaneously
- Fallback to hardcoded version if API is unavailable

### Comprehensive Data Storage
- **Champion Data**: Complete champion information including stats
- **Images**: All champion images (splash, loading, square, centered)
- **Abilities**: All spell icons and passive ability icons
- **Metadata**: Organized data structure for easy access

### Smart Caching
- Checks if champion data already exists before downloading
- Skips existing files to avoid redundant downloads
- Maintains cache integrity with proper error handling

### Performance Benefits
- Faster loading times for champion data
- Reduced API calls to DataDragon
- Offline access to champion information
- Improved user experience in pick/ban phases

## API Endpoints

### Get All Champions
```http
GET /api/v1/champions?enhanced=true
```

### Get Individual Champion
```http
GET /api/v1/champions/{championKey}
```

### Cache Management
```http
GET /api/v1/champions/cache
POST /api/v1/champions/cache
```

## Usage

### Basic Usage
```typescript
import { getChampions, getChampionByKeyEnhanced } from '@lib/champions';

// Get all champions (uses comprehensive cache in Electron)
const champions = await getChampions();

// Get specific champion with enhanced data
const aatrox = await getChampionByKeyEnhanced('Aatrox');
```

### Cache Management

```typescript
import { getChampionCacheStats, refreshChampionsCache } from '@lib/champions';

// Get cache statistics
const stats = await getChampionCacheStats();

// Refresh entire cache
await refreshChampionsCache();
```

### Direct Service Usage

```typescript
import { championCacheService } from '@lib/services/cache/champion';

// Initialize the service
await championCacheService.initialize();

// Download specific champion
const champion = await championCacheService.downloadChampionData('Aatrox', '15.13.1');

// Get cache statistics
const stats = await championCacheService.getCacheStats();
```

## Configuration

The system automatically detects the Electron environment and uses the comprehensive caching system when available. In web environments, it falls back to the basic caching system.

### Environment Detection
- **Electron**: Uses comprehensive file-based caching
- **Web**: Uses localStorage and basic API caching

## Cache Management

### Automatic Cache Updates
- Champions are downloaded on first access
- Version updates trigger cache refresh
- Failed downloads fall back to basic data

### Manual Cache Operations
- **Refresh Cache**: Downloads all champions for current version
- **Clear Cache**: Removes all cached data
- **Cache Stats**: View cache size and champion count

## Error Handling

The system includes robust error handling:

- **Network Failures**: Falls back to cached data
- **API Errors**: Uses fallback versions
- **File System Errors**: Graceful degradation to basic caching
- **Invalid Data**: Skips problematic champions

## Performance Considerations

### Initial Setup
- First run downloads all champions (~160+ champions)
- Can take several minutes depending on connection
- Progress can be monitored via cache stats

### Ongoing Usage
- Subsequent runs use cached data
- Only new champions or version updates require downloads
- Minimal impact on application startup

## Comparison with LeagueBroadcast

This implementation follows LeagueBroadcast's approach:

| Feature | LeagueBroadcast | This Implementation |
|---------|-----------------|-------------------|
| Directory Structure | ✅ | ✅ |
| Champion Images | ✅ | ✅ |
| Ability Icons | ✅ | ✅ |
| Version Management | ✅ | ✅ |
| Cache Statistics | ✅ | ✅ |
| Automatic Updates | ✅ | ✅ |

## Testing

Run the test script to verify the caching system:

```bash
node scripts/test-champion-cache.js
```

## Troubleshooting

### Common Issues

1. **Cache Not Updating**
   - Check internet connection
   - Verify DataDragon API accessibility
   - Clear cache and retry

2. **Missing Champion Data**
   - Refresh cache manually
   - Check for API rate limiting
   - Verify champion key spelling

3. **Performance Issues**
   - Monitor cache size
   - Clear old versions if needed
   - Check disk space

### Debug Information

Enable debug logging to troubleshoot issues:

```typescript
// Add to your application
console.log('Cache stats:', await getChampionCacheStats());
console.log('Champion data:', await getChampionByKeyEnhanced('Aatrox'));
```

## Future Enhancements

- [ ] Background cache updates
- [ ] Incremental updates for new champions
- [ ] Cache compression
- [ ] Multi-language support
- [ ] Cache sharing between instances 