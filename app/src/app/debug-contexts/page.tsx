"use client";

import { useTournaments } from "@libTournament/contexts/TournamentsContext";
import { usePickban } from "@libPickban/contexts/PickbanContext";
import { useSettings } from "@lib/contexts/SettingsContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { PageWrapper } from "@lib/layout/PageWrapper";

export default function DebugContextsPage() {
  return (
    <PageWrapper
      requireAuth={false}
      title="Context Debug Dashboard"
      contentClassName="grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      <AuthDebug />
      <SettingsDebug />
      <TournamentsDebug />
      <PickbanDebug />
    </PageWrapper>
  );
}

function AuthDebug() {
  const { user, isLoading } = useAuth();

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">🔐 Auth Context</h2>
      <div className="space-y-2">
        <p>
          <span className="font-medium">Loading:</span> {isLoading ? "🔄" : "✅"}
        </p>
        <p>
          <span className="font-medium">Authenticated:</span> {user !== null ? "✅" : "❌"}
        </p>
        <p>
          <span className="font-medium">User:</span> {user ? user.email : "None"}
        </p>
      </div>
    </div>
  );
}

function SettingsDebug() {
  const { appSettings, userPreferences, systemInfo, loading, error, toggleTheme, updateAppSettings } = useSettings();

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">⚙️ Settings Context</h2>
      <div className="space-y-2">
        <p>
          <span className="font-medium">Loading:</span> {loading ? "🔄" : "✅"}
        </p>
        <p>
          <span className="font-medium">Error:</span> {error || "None"}
        </p>
        <p>
          <span className="font-medium">Theme:</span> {appSettings.theme}
        </p>
        <p>
          <span className="font-medium">Pick Timer:</span> {appSettings.defaultTimeouts.pickPhase}s
        </p>
        <p>
          <span className="font-medium">Team Display:</span> {userPreferences.teamDisplayMode}
        </p>
        <p>
          <span className="font-medium">Platform:</span> {systemInfo?.platform || "Unknown"}
        </p>
        <p>
          <span className="font-medium">Electron:</span> {systemInfo?.electron ? "✅" : "❌"}
        </p>

        <div className="mt-4 space-x-2">
          <button onClick={toggleTheme} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
            Toggle Theme
          </button>
          <button
            onClick={() =>
              updateAppSettings({
                defaultTimeouts: {
                  ...appSettings.defaultTimeouts,
                  pickPhase: appSettings.defaultTimeouts.pickPhase === 30 ? 45 : 30
                }
              })
            }
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
          >
            Toggle Timer
          </button>
        </div>
      </div>
    </div>
  );
}

function TournamentsDebug() {
  const { tournaments, myTournaments, registeredTournaments, loading, error, refreshTournaments } = useTournaments();

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">🏆 Tournaments Context</h2>
      <div className="space-y-2">
        <p>
          <span className="font-medium">Loading:</span> {loading ? "🔄" : "✅"}
        </p>
        <p>
          <span className="font-medium">Error:</span> {error || "None"}
        </p>
        <p>
          <span className="font-medium">Total Tournaments:</span> {tournaments.length}
        </p>
        <p>
          <span className="font-medium">My Tournaments:</span> {myTournaments.length}
        </p>
        <p>
          <span className="font-medium">Registered:</span> {registeredTournaments.length}
        </p>

        <div className="mt-4">
          <button onClick={refreshTournaments} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

function PickbanDebug() {
  const {
    currentSession,
    sessions,
    connected,
    reconnecting,
    lcuStatus,
    lcuLoading,
    loading,
    error,
    connectToLCU,
    refreshSessions
  } = usePickban();

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">🎮 Pickban Context</h2>
      <div className="space-y-2">
        <p>
          <span className="font-medium">Loading:</span> {loading ? "🔄" : "✅"}
        </p>
        <p>
          <span className="font-medium">Error:</span> {error || "None"}
        </p>
        <p>
          <span className="font-medium">WebSocket:</span> {connected ? "🟢 Connected" : "🔴 Disconnected"}
        </p>
        <p>
          <span className="font-medium">Reconnecting:</span> {reconnecting ? "🔄" : "❌"}
        </p>
        <p>
          <span className="font-medium">Sessions:</span> {sessions.length}
        </p>
        <p>
          <span className="font-medium">Current Session:</span> {currentSession ? currentSession._id : "None"}
        </p>
        <p>
          <span className="font-medium">LCU Status:</span>{" "}
          {lcuLoading ? "🔄" : lcuStatus?.connected ? "🟢 Connected" : "🔴 Disconnected"}
        </p>

        <div className="mt-4 space-x-2">
          <button onClick={refreshSessions} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
            Refresh Sessions
          </button>
          <button
            onClick={connectToLCU}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
            disabled={lcuLoading}
          >
            {lcuLoading ? "Connecting..." : "Connect LCU"}
          </button>
        </div>
      </div>
    </div>
  );
}
