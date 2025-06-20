# VML Nexus Cup - Phase 2 + Electron Features

## 🚀 Overview

Phase 2 brings the VML Nexus Cup to the next level with **Electron desktop app capabilities**, **Riot API integration**, **OBS automation**, and **advanced tournament management**. This hybrid approach keeps the web app fully functional while adding powerful desktop features for professional esports production.

## ✨ New Features

### 🖥️ Electron Desktop App
- **Native desktop application** with enhanced performance
- **Local file system integration** for tournament data and assets
- **Persistent local storage** for champions, templates, and cache
- **Enhanced menu system** with keyboard shortcuts
- **Multi-window support** for overlays and stream control

### 🛡️ Riot API Integration
- **Real-time champion data** from Riot Games Data Dragon
- **Player verification** with PUUID matching
- **Rank and match history** retrieval
- **Intelligent caching** with configurable TTL
- **Rate limiting** to respect API quotas
- **Offline fallback** using local database

### 📹 OBS WebSocket Integration
- **Automated scene switching** during tournaments
- **Dynamic source updates** (team names, overlays, URLs)
- **Stream/recording controls** from within the app
- **Real-time streaming statistics**
- **Tournament-specific scene templates**
- **Error handling and auto-reconnection**

### 🏆 Tournament Templates System
- **Pre-configured tournament formats** (BO1, BO3, BO5)
- **Professional overlay designs** with customizable themes
- **OBS scene configurations** ready for streaming
- **Pick/Ban timing presets** for different tournament types
- **Asset management** for logos, backgrounds, and sounds
- **Template import/export** for sharing configurations

### 💾 Advanced Caching & Performance
- **Multi-layer caching** (memory + local storage + database)
- **Cache statistics and monitoring**
- **Smart invalidation** based on data freshness
- **Offline-first architecture** for reliability
- **Background sync** for seamless updates

## 🏗️ Architecture

### File Structure
```
app/
├── electron/                    # Electron main process
│   ├── main.js                 # Main Electron app
│   └── preload.js              # Secure IPC bridge
├── src/app/
│   ├── lib/services/           # Phase 2 services
│   │   ├── riot-api.ts         # Riot API integration
│   │   ├── obs-integration.ts  # OBS WebSocket control
│   │   └── tournament-templates.ts # Template management
│   ├── components/settings/    # Configuration UI
│   │   └── ElectronSettings.tsx
│   ├── types/
│   │   └── electron.ts         # TypeScript declarations
│   └── api/v1/                 # Enhanced API routes
│       ├── champions/          # Enhanced champions API
│       └── players/verify/     # Player verification
└── package.json                # Updated with Electron scripts
```

### Services Overview

#### 🛡️ Riot API Service (`riot-api.ts`)
```typescript
// Key capabilities:
- getAllChampions() // Latest champion data with caching
- verifyPlayer(gameName, tagLine) // Player identity verification
- getPlayerStats(puuid) // Complete player statistics
- getRankString(rankedData) // Formatted rank display
- Automatic rate limiting and retry logic
- Electron cache integration for offline access
```

#### 📹 OBS Integration Service (`obs-integration.ts`)
```typescript
// Key capabilities:
- connect(config) // WebSocket connection management
- setCurrentScene(sceneName) // Automated scene switching
- setupChampionSelectScene(teams) // Tournament-ready scenes
- setupInGameScene() // Live match configuration
- getStreamingStats() // Real-time stream monitoring
- Event-driven architecture for real-time updates
```

#### 🏆 Tournament Templates Service (`tournament-templates.ts`)
```typescript
// Key capabilities:
- getAllTemplates() // Available tournament formats
- createTournamentFromTemplate(id, settings) // Quick setup
- exportTemplate(id) // Share configurations
- importTemplate(file) // Load custom templates
- Built-in templates: VML Standard, Casual Tournament
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (for Next.js 15)
- MongoDB (for data persistence)
- OBS Studio with WebSocket plugin (optional, for streaming)
- Riot Games API key (optional, for player verification)

### Development Setup

1. **Install dependencies:**
```bash
cd app
npm install
```

2. **Configure environment variables:**
```bash
# .env.local
MONGODB_URI=mongodb://localhost:27017/vml-nexus-cup
RIOT_API_KEY=RGAPI-your-key-here  # Optional
```

3. **Run in development mode:**
```bash
# Web app only
npm run dev

# Electron desktop app
npm run electron-dev
```

4. **Build for production:**
```bash
# Web app
npm run build

# Desktop app distributables
npm run dist
```

### OBS Setup (Optional)

1. Install OBS Studio
2. Enable WebSocket server: Tools → WebSocket Server Settings
3. Configure connection in app settings
4. Import scene collections for best experience

## 🎮 Usage Guide

### Tournament Creation with Templates

1. **Navigate to Settings** → Tournament Templates
2. **Select a template** (VML Standard recommended for professional tournaments)
3. **Customize settings:**
   - Tournament name and dates
   - Team limits and format (BO1/BO3/BO5)
   - Fearless Draft toggle
   - Custom themes and colors
4. **Generate tournament** with pre-configured scenes and overlays

### Player Verification

1. **API endpoint:** `POST /api/v1/players/verify`
2. **Payload:**
```json
{
  "gameName": "PlayerName",
  "tagLine": "EUW",
  "expectedPuuid": "optional-puuid-for-verification",
  "includeStats": true
}
```
3. **Response includes:**
   - Verified player identity
   - Current rank and LP
   - Champion mastery (top 5)
   - Recent match history

### OBS Automation

1. **Connect to OBS** via Settings → OBS Integration
2. **Configure automatic scene switching:**
   - Champion Select → Pick/Ban overlay + team cameras
   - In Game → Game capture + live statistics overlay
   - Break → Custom break screen with messages
3. **Use tournament-specific automation:**
```typescript
// Programmatic control
await obsIntegration.setupChampionSelectScene("Team A", "Team B");
await obsIntegration.setupInGameScene();
```

### Champions Database Management

1. **Automatic updates** from Riot's Data Dragon API
2. **Local caching** for offline access
3. **Manual refresh** via Settings → Riot API → Update Champions Database
4. **Cache statistics** showing data freshness and memory usage

## 🔧 Configuration

### Riot API Settings
- **API Key**: Personal development key from Riot Developer Portal
- **Default Region**: EUW1, NA1, KR, etc.
- **Caching**: Enable for better performance (recommended)
- **Rate Limiting**: Automatic throttling to respect API limits

### OBS Integration Settings  
- **Host**: Usually `localhost` for local OBS
- **Port**: Default `4455` (WebSocket server port)
- **Password**: Optional, set in OBS WebSocket settings
- **Auto-connect**: Connect automatically on app startup
- **Auto Scene Switching**: Enable tournament automation

### Cache Management
- **Champions Cache**: Local champion database with version tracking
- **Player Cache**: Temporary player lookup results
- **Match Cache**: Recent match data for performance
- **Electron Storage**: Persistent desktop app data

## 📊 Performance Benefits

### Caching Strategy
- **Champions**: 24-hour TTL, local database fallback
- **Players**: 1-hour TTL, memory cache
- **Matches**: 30-minute TTL, session cache
- **Rate Limiting**: Automatic with exponential backoff

### Desktop App Advantages
- **Native performance** vs browser limitations
- **Local file system** access for assets
- **Persistent storage** without browser restrictions
- **System integration** (notifications, tray, shortcuts)
- **Multi-window** capabilities for production setups

## 🛠️ Development Notes

### Adding New Tournament Templates
```typescript
const customTemplate: TournamentTemplate = {
  id: 'custom-format',
  name: 'Custom Tournament',
  description: 'Your custom format description',
  format: 'BO5',
  // ... configuration
};

await tournamentTemplates.saveTemplate(customTemplate);
```

### Extending Riot API Integration
```typescript
// Add new endpoint
async getPlayerChampionStats(puuid: string, championId: number) {
  const cacheKey = `champ_stats_${puuid}_${championId}`;
  // ... implementation with caching
}
```

### Custom OBS Scenes
```typescript
// Define scene structure
const customScene = {
  name: 'Custom Scene',
  sources: [
    {
      name: 'Custom Source',
      type: 'browser_source',
      settings: { url: 'http://localhost:3000/custom-overlay' }
    }
  ]
};
```

## 🚀 Deployment

### Web App Deployment
- Standard Next.js deployment (Vercel, Netlify, etc.)
- Requires MongoDB connection for full functionality
- Environment variables for API keys

### Desktop App Distribution
```bash
# Build distributables
npm run dist

# Output locations:
# - Windows: dist/VML Nexus Cup Setup.exe
# - macOS: dist/VML Nexus Cup.dmg  
# - Linux: dist/VML Nexus Cup.AppImage
```

### Auto-Updater (Future Enhancement)
- Built-in update mechanism for desktop app
- Automatic download and installation
- Version checking and rollback capabilities

## 🎯 What's Next

This Phase 2 implementation provides a solid foundation for professional esports tournament management. The hybrid web/desktop approach ensures maximum compatibility while delivering enhanced capabilities for serious tournament organizers.

### Potential Future Enhancements:
- **League Director API** integration for advanced camera control
- **Twitch/YouTube API** for automated stream management  
- **Discord bot** integration for tournament notifications
- **Advanced analytics** dashboard with match insights
- **Custom overlay editor** with drag-and-drop interface
- **Tournament bracket generator** with automatic scheduling

The architecture is designed to be extensible, making it easy to add these features as the platform grows.

---

**Happy tournament organizing! 🏆** 