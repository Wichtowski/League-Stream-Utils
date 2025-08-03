"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@lib/contexts/AuthContext";
import { AuthGuard } from "@lib/components/auth/AuthGuard";
import { BackButton } from '@lib/components/buttons';
import type { Match } from "@lib/types/match";

interface MatchPageProps {
  params: Promise<{
    matchId: string;
  }>;
}

export default function MatchPage({ params }: MatchPageProps): React.ReactElement {
  const user = useUser();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string>('');

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setMatchId(resolvedParams.matchId);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!matchId) return;
    
    const fetchMatch = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/matches/${matchId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch match');
        }
        const data = await response.json();
        setMatch(data.match);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch match');
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  if (!user) {
    return <AuthGuard>{null}</AuthGuard>;
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-white">Loading match...</div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !match) {
    return (
      <AuthGuard>
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
          <BackButton to="/modules/matches" />
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">Error loading match</div>
            <p className="text-gray-500">{error || 'Match not found'}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{match.name}</h1>
            <p className="text-gray-400 mt-2">
              {match.type === 'tournament' ? `Tournament: ${match.tournamentName}` : 'Standalone Match'}
            </p>
          </div>
          <BackButton to="/modules/matches" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main match info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match header */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">{match.blueTeam.tag}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{match.blueTeam.name}</h2>
                    <p className="text-gray-400 text-sm">Blue Team</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">VS</div>
                  <div className="text-sm text-gray-400">{match.format}</div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white text-right">{match.redTeam.name}</h2>
                    <p className="text-gray-400 text-sm text-right">Red Team</p>
                  </div>
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">{match.redTeam.tag}</span>
                  </div>
                </div>
              </div>

              {/* Score */}
              {match.status === 'completed' && (
                <div className="text-center py-4 border-t border-gray-700">
                  <div className="text-4xl font-bold text-white mb-2">
                    {match.score.blue} - {match.score.red}
                  </div>
                  <div className="text-lg text-gray-400">
                    {match.winner === 'blue' ? match.blueTeam.name : match.redTeam.name} wins
                  </div>
                </div>
              )}

              {/* Match details */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-700">
                <div>
                  <span className="text-gray-400 text-sm">Status</span>
                  <div className="text-white font-medium">{match.status}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Patch</span>
                  <div className="text-white font-medium">{match.patchName}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Format</span>
                  <div className="text-white font-medium">{match.format}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Fearless Draft</span>
                  <div className="text-white font-medium">{match.isFearlessDraft ? 'Yes' : 'No'}</div>
                </div>
                {match.scheduledTime && (
                  <div className="col-span-2">
                    <span className="text-gray-400 text-sm">Scheduled Time</span>
                    <div className="text-white font-medium">
                      {new Date(match.scheduledTime).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TeamCard team={match.blueTeam} side="blue" />
              <TeamCard team={match.redTeam} side="red" />
            </div>

            {/* Games */}
            {match.games.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">Games</h3>
                <div className="space-y-4">
                  {match.games.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Commentators */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Commentators</h3>
              {match.commentators.length === 0 ? (
                <p className="text-gray-400 text-sm">No commentators assigned</p>
              ) : (
                <div className="space-y-3">
                  {match.commentators.map((commentator) => (
                    <div key={commentator.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{commentator.name}</div>
                        {commentator.xHandle && (
                          <div className="text-blue-400 text-sm">{commentator.xHandle}</div>
                        )}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(commentator.assignedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Predictions */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Predictions</h3>
              {match.predictions.length === 0 ? (
                <p className="text-gray-400 text-sm">No predictions yet</p>
              ) : (
                <div className="space-y-3">
                  {match.predictions.map((prediction, index) => (
                    <div key={index} className="border-l-2 border-blue-500 pl-3">
                      <div className="text-white font-medium">{prediction.commentatorName}</div>
                      <div className="text-gray-300 text-sm">{prediction.prediction}</div>
                      <div className="text-gray-400 text-xs mt-1">
                        {new Date(prediction.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

interface TeamCardProps {
  team: Match['blueTeam'] | Match['redTeam'];
  side: 'blue' | 'red';
}

function TeamCard({ team, side }: TeamCardProps): React.ReactElement {
  const bgColor = side === 'blue' ? 'bg-blue-900/20' : 'bg-red-900/20';
  const borderColor = side === 'blue' ? 'border-blue-500/30' : 'border-red-500/30';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-6`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className={`w-10 h-10 ${side === 'blue' ? 'bg-blue-600' : 'bg-red-600'} rounded-full flex items-center justify-center`}>
          <span className="text-white font-bold">{team.tag}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{team.name}</h3>
          <p className="text-gray-400 text-sm">{side === 'blue' ? 'Blue Team' : 'Red Team'}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-white font-medium">Players</h4>
        <div className="space-y-2">
          {team.players.map((player) => (
            <div key={player.id} className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm">{player.inGameName}</div>
                <div className="text-gray-400 text-xs">{player.role}</div>
              </div>
            </div>
          ))}
        </div>

        {team.coach && (
          <div className="pt-3 border-t border-gray-600">
            <h4 className="text-white font-medium mb-2">Coach</h4>
            <div className="text-gray-300 text-sm">{team.coach.name}</div>
          </div>
        )}
      </div>
    </div>
  );
}

interface GameCardProps {
  game: Match['games'][0];
}

function GameCard({ game }: GameCardProps): React.ReactElement {
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium">Game {game.gameNumber}</h4>
        <div className="text-sm text-gray-400">
          {Math.floor(game.duration / 60)}:{(game.duration % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-blue-400 font-medium">Blue Team</div>
          <div className="text-white text-lg font-bold">{game.blueTeam.kills}</div>
          <div className="text-gray-400 text-xs">Kills</div>
        </div>
        <div className="text-center">
          <div className="text-red-400 font-medium">Red Team</div>
          <div className="text-white text-lg font-bold">{game.redTeam.kills}</div>
          <div className="text-gray-400 text-xs">Kills</div>
        </div>
      </div>

      <div className="mt-3 text-center">
        <div className="text-white font-medium">
          {game.winner === 'blue' ? 'Blue Team' : 'Red Team'} wins
        </div>
      </div>
    </div>
  );
} 