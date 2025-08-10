"use client";

import { useLCU } from "@lib/contexts/LCUContext";

interface LCUStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function LCUStatusIndicator({
  className = "",
  showDetails = false
}: LCUStatusIndicatorProps): React.ReactElement {
  const {
    isConnected,
    isConnecting,
    connectionError,
    isInitialized,
    lastConnectedAt,
    champSelectSession,
    autoReconnect
  } = useLCU();

  const getStatusColor = (): string => {
    if (isConnected) return "bg-green-500";
    if (isConnecting) return "bg-yellow-500 animate-pulse";
    if (connectionError) return "bg-red-500";
    if (!isInitialized) return "bg-blue-500 animate-pulse";
    return "bg-gray-500";
  };

  const getStatusText = (): string => {
    if (!isInitialized) return "Initializing...";
    if (isConnected) return "Connected";
    if (isConnecting) return "Connecting...";
    if (connectionError) return "Error";
    return "Disconnected";
  };

  const formatLastConnected = (): string => {
    if (!lastConnectedAt) return "Never";
    const now = new Date();
    const diff = now.getTime() - lastConnectedAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-sm text-gray-300">LCU: {getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="font-medium text-white">League Client</span>
        </div>
        <span className="text-sm text-gray-400">{getStatusText()}</span>
      </div>

      {showDetails && (
        <div className="space-y-1 text-xs text-gray-500">
          <div>Last Connected: {formatLastConnected()}</div>
          {champSelectSession && (
            <div className="text-green-400">Champion Select: {champSelectSession.timer?.phase || "Active"}</div>
          )}
          {autoReconnect && <div className="text-blue-400">Auto-reconnect enabled</div>}
          {connectionError && <div className="text-red-400 mt-1 p-2 bg-red-900/20 rounded">{connectionError}</div>}
        </div>
      )}
    </div>
  );
}
