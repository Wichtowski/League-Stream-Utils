"use client";

import { useCurrentMatch } from "@lib/contexts";
import { Button } from "@lib/components/common/buttons/Button";

export const CurrentMatchStatus = (): React.ReactElement => {
  const { currentMatch, loading, clearCurrentMatch } = useCurrentMatch();

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="text-gray-400">Loading current match...</div>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="text-gray-400 mb-3">No current match selected</div>
        <p className="text-sm text-gray-500">
          Select a match as current to integrate with League Client
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Current Match</h3>
        <Button
          onClick={() => clearCurrentMatch()}
          size="sm"
          variant="secondary"
        >
          Clear
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Match:</span>
          <span className="text-white font-medium">{currentMatch.name}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Format:</span>
          <span className="text-white">{currentMatch.format}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Teams:</span>
          <div className="text-right">
            <div className="text-blue-400">{currentMatch.blueTeam.name}</div>
            <div className="text-red-400">{currentMatch.redTeam.name}</div>
          </div>
        </div>
        
        {currentMatch.tournamentId && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Tournament:</span>
            <span className="text-white">{currentMatch.tournamentName}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            currentMatch.status === "in-progress" ? "bg-yellow-600 text-yellow-100" :
            currentMatch.status === "completed" ? "bg-green-600 text-green-100" :
            currentMatch.status === "cancelled" ? "bg-red-600 text-red-100" :
            "bg-gray-600 text-gray-100"
          }`}>
            {currentMatch.status}
          </span>
        </div>
        
        {currentMatch.fearlessDraft && (
          <div className="text-center">
            <span className="text-blue-400 text-sm">⚔️ Fearless Draft</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          This match is now integrated with League Client
        </p>
      </div>
    </div>
  );
};

