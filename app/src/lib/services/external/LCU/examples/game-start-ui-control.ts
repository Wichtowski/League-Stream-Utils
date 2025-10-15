/**
 * Example demonstrating automatic UI control when game starts
 * This shows how the useLiveGameData hook will automatically call hideUIKeepEssentials
 * when game data is successfully received for the first time.
 */

import { useLiveGameData } from "@lib/hooks/useLiveGameData";

export const GameStartUIControlExample = () => {
  const { gameData, isConnected, error } = useLiveGameData();

  return (
    <div>
      <h2>Game Start UI Control Example</h2>
      
      <div>
        <strong>Connection Status:</strong> {isConnected ? "Connected" : "Disconnected"}
      </div>
      
      <div>
        <strong>Game Data:</strong> {gameData ? "Available" : "Not Available"}
      </div>
      
      <div>
        <strong>Error:</strong> {error || "None"}
      </div>
      
      {gameData && (
        <div>
          <h3>Game Information:</h3>
          <p><strong>Game Mode:</strong> {gameData.gameMode}</p>
          <p><strong>Map:</strong> {gameData.mapName}</p>
          <p><strong>Game Time:</strong> {gameData.gameTime}s</p>
          <p><strong>Blue Team Players:</strong> {gameData.blueTeam.players.length}</p>
          <p><strong>Red Team Players:</strong> {gameData.redTeam.players.length}</p>
        </div>
      )}
      
      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f0f0f0" }}>
        <h4>Automatic UI Control:</h4>
        <p>
          When game data is first received, the system will automatically:
        </p>
        <ul>
          <li>Hide most UI elements</li>
          <li>Keep essential elements visible:
            <ul>
              <li>Minimap</li>
              <li>Kill callouts</li>
              <li>Announcements</li>
              <li>Neutral timers</li>
              <li>Quests</li>
            </ul>
          </li>
          <li>Set field of view to 50.0 degrees</li>
          <li>Enable banners</li>
        </ul>
        <p>
          This happens automatically when the game starts and data is successfully fetched.
          The UI control is only applied once per game session.
        </p>
      </div>
    </div>
  );
};

/**
 * Manual UI control functions for testing
 */
export const manualUIControl = {
  // Hide all UI
  hideAll: async (): Promise<void> => {
    const response = await fetch("/api/v1/leagueclient/ui-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hideAll" })
    });
    const result = await response.json();
    console.log("Hide all UI:", result);
  },

  // Show all UI
  showAll: async (): Promise<void> => {
    const response = await fetch("/api/v1/leagueclient/ui-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "showAll" })
    });
    const result = await response.json();
    console.log("Show all UI:", result);
  },

  // Hide UI but keep essentials (same as automatic)
  hideKeepEssentials: async (): Promise<void> => {
    const response = await fetch("/api/v1/leagueclient/ui-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hideKeepEssentials" })
    });
    const result = await response.json();
    console.log("Hide keep essentials:", result);
  },

  // Get current UI settings
  getCurrentSettings: async (): Promise<void> => {
    const response = await fetch("/api/v1/leagueclient/ui-control");
    const result = await response.json();
    console.log("Current UI settings:", result);
  }
};
