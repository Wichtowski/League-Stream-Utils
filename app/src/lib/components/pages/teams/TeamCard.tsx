import React from 'react';
import type { Team } from '@lib/types';
import { InlineSpinner } from '@lib/components/common';

interface TeamCardProps {
  team: Team;
  currentUserId?: string;
  isAdmin?: boolean;
  verifyingPlayers: Set<string>;
  verifyingAllTeams: Set<string>;
  onEditTeam: (teamId: string) => void;
  onVerifyPlayer: (teamId: string, playerId: string, playerName: string, playerTag: string) => Promise<void>;
  onVerifyAllPlayers: (team: Team) => Promise<void>;
  onAdminVerify: (team: Team) => Promise<void>;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  currentUserId,
  isAdmin,
  verifyingPlayers,
  verifyingAllTeams,
  onEditTeam,
  onVerifyPlayer,
  onVerifyAllPlayers,
  onAdminVerify
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">{team.name}</h3>
          <p className="text-gray-400">{team.tag} • {team.region} • {team.tier}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className="w-6 h-6 rounded"
            style={{ backgroundColor: team.colors.primary }}
          ></div>
          <span className={`px-3 py-1 rounded text-sm ${team.verified ? 'bg-green-600' : 'bg-yellow-600'}`}>
            {team.verified ? 'Verified' : 'Pending Verification'}
          </span>
          {(currentUserId === team.userId || isAdmin) && (
            <button
              className="ml-2 text-xs px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
              onClick={() => onEditTeam(team.id)}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Main Roster</h4>
          <div className="flex space-x-2">
            <button
              onClick={() => onVerifyAllPlayers(team)}
              className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              disabled={verifyingAllTeams.has(team.id)}
            >
              {verifyingAllTeams.has(team.id) ? <InlineSpinner size="sm" variant="white" /> : 'Verify All'}
            </button>
            {isAdmin && (
              <button
                onClick={() => onAdminVerify(team)}
                className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
              >
                Admin Verify
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {team.players.main.map((player) => (
            <div key={player.id} className="bg-gray-700 rounded p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">{player.role}</div>
              <div className="font-medium">{player.inGameName}</div>
              <div className="text-xs text-gray-400 mb-2">{player.tag}</div>

              {player.verified ? (
                <div className="text-xs text-green-400">
                  ✓ Verified
                  {player.verifiedAt && (
                    <div className="text-gray-500">
                      {new Date(player.verifiedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onVerifyPlayer(team.id, player.id, player.inGameName, player.tag)}
                  disabled={verifyingPlayers.has(player.id)}
                  className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded transition-colors w-full"
                >
                  {verifyingPlayers.has(player.id) ? <InlineSpinner size="sm" variant="white" /> : 'Verify'}
                </button>
              )}
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
              <div key={player.id} className="bg-gray-700 rounded p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">{player.role}</div>
                <div className="font-medium">{player.inGameName}</div>
                <div className="text-xs text-gray-400 mb-2">{player.tag}</div>

                {player.verified ? (
                  <div className="text-xs text-green-400">✓ Verified</div>
                ) : (
                  <button
                    onClick={() => onVerifyPlayer(team.id, player.id, player.inGameName, player.tag)}
                    disabled={verifyingPlayers.has(player.id)}
                    className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded transition-colors w-full"
                  >
                    {verifyingPlayers.has(player.id) ? <InlineSpinner size="sm" variant="white" /> : 'Verify'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team verification status summary */}
      <div className="mt-4 p-3 bg-gray-700 rounded">
        <div className="text-sm text-gray-300">
          <strong>Verification Status:</strong>
          <span className={`ml-2 ${team.verified ? 'text-green-400' : 'text-yellow-400'}`}>
            {team.verified ? 'Team Verified' : 'Pending Team Verification'}
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Players: {team.players.main.filter(p => p.verified).length}/{team.players.main.length} verified
          {team.players.substitutes.length > 0 && (
            <span> • Subs: {team.players.substitutes.filter(p => p.verified).length}/{team.players.substitutes.length} verified</span>
          )}
        </div>
      </div>
    </div>
  );
}; 