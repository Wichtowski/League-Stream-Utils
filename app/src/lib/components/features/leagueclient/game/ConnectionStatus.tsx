import React from "react";

interface ConnectionStatusProps {
  isConnected: boolean;
  onDisconnect: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  onDisconnect,
  onRefresh
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-4 text-white max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Connection Status</h3>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
      
      <div className="space-y-3">
        <div className="text-xs">
          <div className="flex items-center space-x-2">
            <span>Status:</span>
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onRefresh}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={onDisconnect}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};
