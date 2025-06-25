# Data Context Usage Guide

This guide demonstrates how to use the new data contexts for blazing fast performance with smart caching and automatic sync detection.

## Overview

All contexts provide:
- ⚡ **Instant loading** from localStorage/AppData cache
- 🔄 **Background sync** with server data
- 📱 **Universal storage** (web localStorage + Electron AppData)
- 🚨 **Automatic mismatch detection** and refresh
- 💾 **Smart caching** with TTL and checksums
- 🔌 **Real-time updates** via WebSocket (where applicable)

## Teams Context

### Basic Usage

```tsx
import { useTeams } from '@lib/contexts/TeamsContext';

function TeamsManager() {
  const {
    teams,
    loading,
    error,
    createTeam,
    updateTeam,
    verifyTeam,
    refreshTeams,
    getLastSync
  } = useTeams();

  // Data is instantly available from cache
  if (loading) return <div>Loading teams...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Teams ({teams.length})</h2>
      {teams.map(team => (
        <TeamCard 
          key={team.id} 
          team={team}
          onVerify={() => verifyTeam(team.id)}
          onEdit={(updates) => updateTeam(team.id, updates)}
        />
      ))}
      <button onClick={refreshTeams}>Refresh</button>
    </div>
  );
}
```

### Advanced Operations

```tsx
// Create a new team
const handleCreateTeam = async (teamData) => {
  const result = await createTeam(teamData);
  if (result.success) {
    // Team automatically added to cache and UI updates instantly
    console.log('Team created:', result.team);
  } else {
    console.error('Failed to create team:', result.error);
  }
};

// Bulk operations
const handleVerifyAllPlayers = async (teamId) => {
  const result = await verifyAllPlayers(teamId);
  if (result.success) {
    // Background refresh triggered automatically
    console.log('All players verified');
  }
};

// Cache management
const handleClearCache = async () => {
  await clearCache();
  console.log('Teams cache cleared');
};

// Check last sync time
const lastSync = await getLastSync();
console.log('Last synced:', lastSync?.toLocaleString());
```

## Tournaments Context

### Basic Usage

```tsx
import { useTournaments } from '@lib/contexts/TournamentsContext';

function TournamentDashboard() {
  const {
    tournaments,
    myTournaments,
    registeredTournaments,
    loading,
    error,
    createTournament,
    registerTeam,
    startTournament,
    getBracket
  } = useTournaments();

  return (
    <div>
      <section>
        <h2>My Tournaments ({myTournaments.length})</h2>
        {myTournaments.map(tournament => (
          <TournamentCard 
            key={tournament.id}
            tournament={tournament}
            onStart={() => startTournament(tournament.id)}
            onViewBracket={() => getBracket(tournament.id)}
          />
        ))}
      </section>

      <section>
        <h2>Registered Tournaments ({registeredTournaments.length})</h2>
        {registeredTournaments.map(tournament => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </section>
    </div>
  );
}
```

### Tournament Management

```tsx
// Create tournament with instant feedback
const handleCreateTournament = async (tournamentData) => {
  const result = await createTournament(tournamentData);
  if (result.success) {
    // Tournament appears instantly in myTournaments
    setSelectedTournament(result.tournament);
  }
};

// Team registration
const handleRegisterTeam = async (tournamentId, teamId) => {
  const result = await registerTeam(tournamentId, teamId);
  if (result.success) {
    // Tournament data refreshes automatically in background
    console.log('Team registered successfully');
  }
};

// Bracket management
const handleUpdateBracket = async (tournamentId, bracket) => {
  const result = await updateBracket(tournamentId, bracket);
  if (result.success) {
    console.log('Bracket updated');
  }
};

// Tournament statistics
const handleGetStats = async (tournamentId) => {
  const result = await getTournamentStats(tournamentId);
  if (result.success) {
    console.log('Tournament stats:', result.stats);
  }
};
```

## Pickban Context

### Basic Usage with Real-time Updates

```tsx
import { usePickban } from '@lib/contexts/PickbanContext';

function PickbanInterface() {
  const {
    currentSession,
    sessions,
    connected,
    lcuStatus,
    loading,
    createSession,
    joinSession,
    performAction,
    connectToLCU,
    syncWithLCU
  } = usePickban();

  return (
    <div>
      <div>
        WebSocket Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
        LCU Status: {lcuStatus?.connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {currentSession ? (
        <ActivePickbanSession 
          session={currentSession}
          onAction={performAction}
          onSyncLCU={syncWithLCU}
        />
      ) : (
        <SessionSelector 
          sessions={sessions}
          onJoin={joinSession}
          onCreate={createSession}
        />
      )}
    </div>
  );
}
```

### Session Management

```tsx
// Create new session
const handleCreateSession = async (config) => {
  const result = await createSession(config);
  if (result.success) {
    // Automatically join the created session
    await joinSession(result.session.id);
  }
};

// Perform pick/ban actions (real-time via WebSocket)
const handlePickChampion = async (championId) => {
  const action = {
    id: generateId(),
    type: 'pick',
    championId,
    teamSide: currentSession.currentTeam,
    phase: currentSession.currentPhase,
    timestamp: new Date()
  };
  
  await performAction(action);
  // Action applied instantly via WebSocket
};

// LCU Integration
const handleConnectLCU = async () => {
  const result = await connectToLCU();
  if (result.success) {
    console.log('Connected to League Client');
    // LCU status updates automatically via context
  }
};

// Session cleanup
const handleLeaveSession = () => {
  leaveSession();
  // WebSocket disconnected, session cleared
};
```

## Settings Context

### Basic Usage

```tsx
import { useSettings } from '@lib/contexts/SettingsContext';

function SettingsPanel() {
  const {
    appSettings,
    userPreferences,
    systemInfo,
    loading,
    updateAppSettings,
    updateUserPreferences,
    toggleTheme,
    addFavoriteChampion,
    exportSettings,
    importSettings
  } = useSettings();

  return (
    <div>
      <section>
        <h2>App Settings</h2>
        <label>
          Theme: {appSettings.theme}
          <button onClick={toggleTheme}>Toggle Theme</button>
        </label>
        
        <label>
          Pick Phase Timer:
          <input 
            type="number"
            value={appSettings.defaultTimeouts.pickPhase}
            onChange={(e) => updateAppSettings({
              defaultTimeouts: {
                ...appSettings.defaultTimeouts,
                pickPhase: parseInt(e.target.value)
              }
            })}
          />
        </label>
      </section>

      <section>
        <h2>User Preferences</h2>
        <label>
          Display Mode: {userPreferences.teamDisplayMode}
          <select 
            value={userPreferences.teamDisplayMode}
            onChange={(e) => updateUserPreferences({
              teamDisplayMode: e.target.value as 'list' | 'grid' | 'cards'
            })}
          >
            <option value="list">List</option>
            <option value="grid">Grid</option>
            <option value="cards">Cards</option>
          </select>
        </label>

        <div>
          Favorite Champions: {userPreferences.favoriteChampions.length}
          <button onClick={() => addFavoriteChampion('ahri')}>
            Add Ahri to Favorites
          </button>
        </div>
      </section>

      <section>
        <h2>System Info</h2>
        <p>Version: {systemInfo?.version}</p>
        <p>Platform: {systemInfo?.platform}</p>
        <p>Electron: {systemInfo?.electron ? 'Yes' : 'No'}</p>
      </section>
    </div>
  );
}
```

### Settings Management

```tsx
// Bulk settings update
const handleUpdateNotifications = async () => {
  await updateAppSettings({
    notifications: {
      enabled: true,
      sound: false,
      desktop: true
    }
  });
  // Settings synced to cloud (if authenticated) + stored locally
};

// Champion favorites management
const handleToggleFavorite = async (championId) => {
  if (userPreferences.favoriteChampions.includes(championId)) {
    await removeFavoriteChampion(championId);
  } else {
    await addFavoriteChampion(championId);
  }
};

// Export/Import settings
const handleExportSettings = async () => {
  const result = await exportSettings();
  if (result.success) {
    // Download JSON file or copy to clipboard
    console.log('Settings exported:', result.data);
  }
};

const handleImportSettings = async (file) => {
  const text = await file.text();
  const result = await importSettings(text);
  if (result.success) {
    console.log('Settings imported successfully');
  }
};

// Reset everything
const handleResetSettings = async () => {
  const result = await resetToDefaults();
  if (result.success) {
    console.log('Settings reset to defaults');
  }
};
```

## Performance Features

### Instant Loading
```tsx
// Data loads instantly from cache, no loading spinner needed
function InstantTeamsList() {
  const { teams } = useTeams();
  
  // teams array populated immediately on first render
  return (
    <div>
      {teams.map(team => <TeamCard key={team.id} team={team} />)}
    </div>
  );
}
```

### Background Sync Detection
```tsx
// Automatic sync detection runs every 20-30 seconds
// If server data differs from cache, it auto-refreshes
// User sees instant data, gets updates seamlessly

function SyncAwareComponent() {
  const { teams, getLastSync } = useTeams();
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    getLastSync().then(setLastSync);
  }, [teams]); // Updates when data refreshes

  return (
    <div>
      <p>Data last synced: {lastSync?.toLocaleString()}</p>
      <p>Teams loaded: {teams.length}</p>
    </div>
  );
}
```

### Cache Management
```tsx
function CacheControls() {
  const teams = useTeams();
  const tournaments = useTournaments();
  const pickban = usePickban();
  const settings = useSettings();

  const handleClearAllCaches = async () => {
    await Promise.all([
      teams.clearCache(),
      tournaments.clearCache(),
      pickban.clearCache(),
      settings.clearCache()
    ]);
    console.log('All caches cleared');
  };

  return <button onClick={handleClearAllCaches}>Clear All Caches</button>;
}
```

## Universal Storage (Web + Electron)

The contexts automatically handle:

**Web Browser:**
- Uses `localStorage` for persistent storage
- Prefixed with `web-` for easy identification
- Supports TTL expiration and checksums

**Electron App:**
- Uses AppData directory for persistent storage
- Prefixed with `electron-local-` when in local mode
- Survives app updates and restarts
- Supports the same TTL and checksum features

**Automatic Detection:**
```tsx
// No code changes needed - contexts detect environment automatically
function UniversalComponent() {
  const { teams } = useTeams();
  
  // Works identically in web browser and Electron
  // Data persists appropriately for each environment
  return <TeamsList teams={teams} />;
}
```

## Best Practices

1. **Use contexts early in component tree** - Data loads on app startup
2. **Don't manually manage loading states** - Contexts handle this efficiently
3. **Leverage optimistic updates** - UI updates instantly, syncs in background
4. **Use cache management sparingly** - Only clear when necessary
5. **Monitor sync status** - Use `getLastSync()` for debugging
6. **Handle errors gracefully** - Contexts provide error states

## Error Handling

```tsx
function RobustComponent() {
  const { teams, error, refreshTeams } = useTeams();

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={refreshTeams}>Retry</button>
      </div>
    );
  }

  return <TeamsList teams={teams} />;
}
```

This context system provides a blazing fast, reliable foundation for all data management in the application! 