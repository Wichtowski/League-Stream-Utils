import React, { useState } from "react";
import { Button } from "@lib/components/common";

export const OBSControl: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  const connectToOBS = async (): Promise<void> => {
    try {
      setConnectionStatus("Connecting...");
      // TODO: Implement OBS WebSocket connection
      // This is a placeholder for the actual OBS connection logic
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsConnected(true);
      setConnectionStatus("Connected");
    } catch (error) {
      setConnectionStatus("Connection failed");
      console.error("Failed to connect to OBS:", error);
    }
  };

  const disconnectFromOBS = async (): Promise<void> => {
    try {
      setConnectionStatus("Disconnecting...");
      // TODO: Implement OBS WebSocket disconnection
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsConnected(false);
      setConnectionStatus("Disconnected");
    } catch (error) {
      console.error("Failed to disconnect from OBS:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">OBS Studio Control</h3>
        <p className="mt-1 text-sm text-gray-500">
          Connect to OBS Studio to control scenes and sources during tournaments.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Connection Status</p>
            <p className={`text-sm ${isConnected ? "text-green-600" : "text-red-600"}`}>{connectionStatus}</p>
          </div>
          <Button
            onClick={isConnected ? disconnectFromOBS : connectToOBS}
            disabled={connectionStatus === "Connecting..." || connectionStatus === "Disconnecting..."}
            variant={isConnected ? "secondary" : "primary"}
          >
            {isConnected ? "Disconnect" : "Connect to OBS"}
          </Button>
        </div>
      </div>

      {isConnected && (
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Scene Control</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm">
                Switch to Tournament Scene
              </Button>
              <Button variant="secondary" size="sm">
                Switch to Break Scene
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Source Control</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm">
                Show Team Logos
              </Button>
              <Button variant="secondary" size="sm">
                Hide Team Logos
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Install OBS Studio on your computer</li>
          <li>Enable WebSocket server in OBS (Tools -&gt; WebSocket Server Settings)</li>
          <li>Set a password for the WebSocket server</li>
          <li>Click &quot;Connect to OBS&quot; above</li>
        </ol>
      </div>
    </div>
  );
};
