import React from "react";
import type { Team } from "@libTeam/types";

interface TeamCardProps {
  team: Team;
  currentUserId?: string;
  isAdmin?: boolean;
  onEditTeam: () => void;
  onDeleteTeam: () => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, currentUserId, isAdmin, onEditTeam, onDeleteTeam }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">{team.name}</h3>
          <p className="text-gray-400">
            {team.tag} • {team.region} • {team.tier}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded" style={{ backgroundColor: team.colors.primary }}></div>
          {(currentUserId === team.teamOwnerId || isAdmin) && (
            <div className="flex space-x-2">
              <button
                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                onClick={onEditTeam}
              >
                Edit
              </button>
              <button
                className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                onClick={onDeleteTeam}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Main Roster</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {team.players.main.map((player) => (
            <div key={player._id} className="bg-gray-700 rounded p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">{player.role}</div>
              <div
                className="font-medium text-blue-400 hover:text-blue-300 cursor-pointer transition-colors group relative"
                onClick={() => (window.location.href = `/modules/teams/${team._id}/${player._id}`)}
                title="Click to view player stats"
              >
                {player.inGameName}
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400">
                  View Stats
                </span>
              </div>
              <div className="text-xs text-gray-400 mb-2">{player.tag}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Show substitute players if any */}
      {team.players.substitutes.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Substitutes</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {team.players.substitutes.map((player) => (
              <div key={player._id} className="bg-gray-700 rounded p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">{player.role}</div>
                <div
                  className="font-medium text-blue-400 hover:text-blue-300 cursor-pointer transition-colors group relative"
                  onClick={() => (window.location.href = `/modules/teams/${team._id}/${player._id}`)}
                  title="Click to view player stats"
                >
                  {player.inGameName}
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400">
                    View Stats
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-2">{player.tag}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team info summary */}
      <div className="mt-4 p-3 bg-gray-700 rounded">
        <div className="text-sm text-gray-300">
          <strong>Team Info:</strong>
          <div className="text-xs text-gray-400 mt-1">
            Players: {team.players.main.length} main, {team.players.substitutes.length} substitutes
          </div>
          {team.founded && (
            <div className="text-xs text-gray-400">Founded: {new Date(team.founded).toLocaleDateString()}</div>
          )}
        </div>
      </div>
    </div>
  );
};
