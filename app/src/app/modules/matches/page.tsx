"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@lib/contexts/AuthContext";
import { AuthGuard } from "@lib/components/auth/AuthGuard";
import { BackButton } from '@lib/components/common';
import type { Match } from "@lib/types/match";

export default function MatchesPage(): React.ReactElement {
  const user = useUser();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/matches');
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }
        const data = await response.json();
        setMatches(data.matches || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (!user) {
    return <AuthGuard>{null}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Standalone Matches</h1>
            <p className="text-gray-400 mt-2">Manage and view standalone matches</p>
          </div>
          <BackButton />
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-white">Loading matches...</div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No standalone matches found</div>
            <p className="text-gray-500">Create your first match to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

interface MatchCardProps {
  match: Match;
}

function MatchCard({ match }: MatchCardProps): React.ReactElement {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-yellow-400';
      case 'in-progress': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-200 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{match.name}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(match.status)}`}>
          {getStatusText(match.status)}
        </span>
      </div>

      <div className="space-y-4">
        {/* Teams */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{match.blueTeam.tag}</span>
            </div>
            <span className="text-white font-medium">{match.blueTeam.name}</span>
          </div>
          <div className="text-gray-400 text-sm">vs</div>
          <div className="flex items-center space-x-3">
            <span className="text-white font-medium">{match.redTeam.name}</span>
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{match.redTeam.tag}</span>
            </div>
          </div>
        </div>

        {/* Score */}
        {match.status === 'completed' && (
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {match.score.blue} - {match.score.red}
            </div>
            <div className="text-sm text-gray-400">
              {match.winner === 'blue' ? match.blueTeam.name : match.redTeam.name} wins
            </div>
          </div>
        )}

        {/* Match details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Format:</span>
            <span className="text-white">{match.format}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Patch:</span>
            <span className="text-white">{match.patchName}</span>
          </div>
          {match.scheduledTime && (
            <div className="flex justify-between">
              <span className="text-gray-400">Scheduled:</span>
              <span className="text-white">
                {new Date(match.scheduledTime).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Commentators:</span>
            <span className="text-white">{match.commentators.length}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-4">
          <button
            onClick={() => window.location.href = `/modules/matches/${match.id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View Details
          </button>
          {match.status === 'scheduled' && (
            <button
              onClick={() => window.location.href = `/modules/matches/${match.id}/edit`}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 