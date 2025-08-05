"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useUser } from "@lib/contexts/AuthContext";
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useModal } from '@lib/components/modal';
import { AuthGuard } from "@lib/components/auth/AuthGuard";
import { LoadingSpinner } from '@lib/components/common';
import type { Match } from "@lib/types/match";
import type { Tournament } from "@lib/types/tournament";
import { tournamentStorage, LastSelectedTournament } from '@lib/utils/storage/tournament-storage';

export default function MatchesPage(): React.ReactElement {
  const router = useRouter();
  const user = useUser();
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSelectedTournament, setLastSelectedTournament] = useState<LastSelectedTournament | null>(null);

  useEffect(() => {
    setActiveModule('matches');
  }, [setActiveModule]);

  useEffect(() => {
    const loadLastSelectedTournament = async () => {
      try {
        const lastSelected = await tournamentStorage.getLastSelectedTournament();
        if (lastSelected && await tournamentStorage.isLastSelectedTournamentValid()) {
          setLastSelectedTournament(lastSelected);
        } else {
          await showAlert({ 
            type: 'error', 
            message: 'No tournament selected. Please select a tournament first.' 
          });
          router.push('/modules/tournaments');
        }
      } catch (_error) {
        await showAlert({ 
          type: 'error', 
          message: 'Failed to load tournament selection.' 
        });
        router.push('/modules/tournaments');
      }
    };

    loadLastSelectedTournament();
  }, [router, showAlert]);

  useEffect(() => {
    if (!lastSelectedTournament) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tournament data
        const tournamentResponse = await fetch(`/api/v1/tournaments/${lastSelectedTournament.tournamentId}`);
        if (!tournamentResponse.ok) {
          throw new Error('Failed to fetch tournament');
        }
        const tournamentData = await tournamentResponse.json();
        setTournament(tournamentData.tournament);

        // Fetch matches
        const matchesResponse = await fetch(`/api/v1/tournaments/${lastSelectedTournament.tournamentId}/matches`);
        if (!matchesResponse.ok) {
          throw new Error('Failed to fetch matches');
        }
        const matchesData = await matchesResponse.json();
        setMatches(matchesData.matches || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lastSelectedTournament]);

  if (!user) {
    return <AuthGuard>{null}</AuthGuard>;
  }

  if (loading) {
    return (
      <AuthGuard loadingMessage="Loading matches...">
        <LoadingSpinner fullscreen text="Loading matches..." />
      </AuthGuard>
    );
  }

  if (!tournament || !lastSelectedTournament) {
    return (
      <AuthGuard loadingMessage="Loading tournament...">
        <div className="min-h-screen text-white">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
              <p>The tournament you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
              <button
                onClick={() => router.push('/modules/tournaments')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                Select Tournament
              </button>
            </div>
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
            <h1 className="text-3xl font-bold text-white">
              {tournament ? `${tournament.name} Matches` : 'Tournament Matches'}
            </h1>
            <p className="text-gray-400 mt-2">
              {tournament ? tournament.abbreviation : 'Loading...'}
            </p>
            <button
              onClick={() => router.push('/modules/tournaments')}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              ← Change Tournament
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No matches found for this tournament</div>
            <p className="text-gray-500">Matches will appear here once they are created</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {matches.map((match) => (
              <TournamentMatchCard key={match.id} match={match} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

interface TournamentMatchCardProps {
  match: Match;
  tournament: Tournament | null;
}

function TournamentMatchCard({ match, tournament }: TournamentMatchCardProps): React.ReactElement {
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
        <div>
          <h3 className="text-xl font-semibold text-white">{match.name}</h3>
          {match.roundName && (
            <p className="text-gray-400 text-sm">{match.roundName}</p>
          )}
        </div>
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
            onClick={() => window.location.href = `/modules/tournaments/${tournament?.id}/matches/${match.id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View Details
          </button>
          {match.status === 'scheduled' && (
            <button
              onClick={() => window.location.href = `/modules/tournaments/${tournament?.id}/matches/${match.id}/edit`}
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