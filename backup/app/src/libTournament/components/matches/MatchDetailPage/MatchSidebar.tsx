import React from "react";
import { Button } from "@lib/components/common";
import { Match, MatchStatus } from "@libTournament/types";

interface MatchSidebarProps {
  match: Match;
  teamWins: { team1Wins: number; team2Wins: number };
  onStatusChange: (status: MatchStatus) => Promise<boolean>;
}

export const MatchSidebar: React.FC<MatchSidebarProps> = ({
  match,
  teamWins,
  onStatusChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Change Match Status</h3>
        <div className="space-y-3">
          {match.status !== "scheduled" && (
            <Button onClick={() => onStatusChange("scheduled")} variant="secondary" className="w-full">
              Schedule Match
            </Button>
          )}
          {match.status !== "in-progress" && (
            <Button onClick={() => onStatusChange("in-progress")} variant="secondary" className="w-full">
              Start Match
            </Button>
          )}
          {match.status !== "completed" && (
            <Button onClick={() => onStatusChange("completed")} variant="secondary" className="w-full">
              Complete Match
            </Button>
          )}
          {match.status !== "cancelled" && (
            <Button onClick={() => onStatusChange("cancelled")} variant="secondary" className="w-full">
              Cancel Match
            </Button>
          )}
        </div>
      </div>

      {/* Match Info */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Match Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Match ID:</span>
            <span className="text-white font-mono">{match._id.slice(-8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Type:</span>
            <span className="text-white capitalize">{match.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Patch:</span>
            <span className="text-white">{match.patchName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Created:</span>
            <span className="text-white">{new Date(match.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Score:</span>
            <span className="text-white font-mono">
              {teamWins.team1Wins} - {teamWins.team2Wins}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
