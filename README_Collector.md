# League Data Collector

A Python companion app that automatically collects live player data from the League of Legends client and sends it to your MongoDB database.

## Features

- 🔄 **Automatic Data Collection**: Polls League client every 1 second
- 🎯 **Match-Specific Data**: Associates data with specific match IDs
- 💾 **MongoDB Integration**: Stores player live info in your database
- 🔒 **SSL Handling**: Properly handles League client's self-signed certificates
- 📊 **Rich Player Data**: Collects gold, health, champion stats, and more

## Quick Start

### Option 1: Run as Python Script

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Collector**:
   ```bash
   python league_collector.py
   ```

3. **Enter Required Information**:
   - Match ID (e.g., `match_12345`)
   - MongoDB URI (e.g., `mongodb://localhost:27017/your-database`)

### Option 2: Build Executable (Windows)

1. **Run Build Script**:
   ```bash
   build.bat
   ```

2. **Find Executable**:
   - Location: `dist/LeagueDataCollector.exe`
   - No Python installation required on target machine

## Data Collection

The collector automatically extracts and sends:

```json
{
  "riotId": "player123",
  "riotIdGameName": "PlayerName",
  "riotIdTagLine": "TAG",
  "summonerName": "PlayerName#TAG",
  "currentGold": 1500,
  "championStats": {
    "resourceType": "Mana",
    "resourceValue": 800,
    "maxHealth": 2000,
    "currentHealth": 1800
  },
  "timestamp": 1640995200,
  "matchId": "match_12345"
}
```

## MongoDB Integration

The collector creates/updates documents in the `playerLiveInfo` collection:

- **Indexed by**: `matchId` (for fast queries)
- **Upsert Strategy**: Updates existing player data or creates new entries
- **Unique by**: `riotId` + `matchId` combination

## API Integration

Your `/api/game` endpoint now supports enhanced data:

1. **Send Match ID**: Include `x-match-id` header in requests
2. **Enhanced Response**: Player data includes live info from collectors
3. **Automatic Binding**: Players matched by `riotId`

### Example API Call:
```javascript
fetch('/api/game', {
  headers: {
    'x-match-id': 'match_12345'
  }
})
```

## Requirements

- **Python 3.7+** (for script version)
- **League of Legends Client** running
- **MongoDB** database accessible
- **Network Access** to League client (127.0.0.1:2999)

## Troubleshooting

### Common Issues

1. **"League client not running"**
   - Ensure League of Legends is running
   - Check that you're in a game or practice tool

2. **"MongoDB connection failed"**
   - Verify MongoDB URI is correct
   - Check network connectivity to database

3. **"SSL certificate errors"**
   - This is normal for League client
   - The collector handles this automatically

### Debug Mode

Run with verbose output:
```bash
python league_collector.py --verbose
```

## Security Notes

- The collector uses `verify=False` for League client SSL
- MongoDB connections should use proper authentication
- Consider using environment variables for sensitive data

## Performance

- **Polling Interval**: 1 second (configurable)
- **Database Impact**: Minimal (upsert operations)
- **Memory Usage**: Low (~10MB)
- **CPU Usage**: Minimal

## Support

For issues or questions:
1. Check the console output for error messages
2. Verify League client is running and accessible
3. Test MongoDB connection separately
4. Check network connectivity

## License

This tool is part of the League Stream Utils project.

