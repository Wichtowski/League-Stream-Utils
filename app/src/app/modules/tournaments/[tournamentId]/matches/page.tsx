"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@lib/contexts/AuthContext";
import { BackButton } from "@lib/components/common/buttons";
import type { Match } from "@lib/types/match";
import type { Tournament } from "@lib/types/tournament";
import { PageWrapper } from "@lib/layout/PageWrapper";

interface TournamentMatchesPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default function TournamentMatchesPage({ params }: TournamentMatchesPageProps): React.ReactElement {
  const user = useUser();
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string>("");

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTournamentId(resolvedParams.tournamentId);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!tournamentId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch tournament data
        const tournamentResponse = await fetch(`/api/v1/tournaments/${tournamentId}`);
        if (!tournamentResponse.ok) {
          throw new Error("Failed to fetch tournament");
        }
        const tournamentData = await tournamentResponse.json();
        setTournament(tournamentData.tournament);

        // Fetch matches
        const matchesResponse = await fetch(`/api/v1/tournaments/${tournamentId}/matches`);
        if (!matchesResponse.ok) {
          throw new Error("Failed to fetch matches");
        }
        const matchesData = await matchesResponse.json();
        setMatches(matchesData.matches || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournamentId]);

  if (!user) {
    return <PageWrapper requireAuth={true}>{null}</PageWrapper>;
  }

  return (
    <PageWrapper
      title={tournament ? `${tournament.name} Matches` : "Tournament Matches"}
      subtitle={tournament ? tournament.abbreviation : "Loading..."}
      actions={<BackButton to="/modules/tournaments" />}
      contentClassName="max-w-6xl mx-auto"
    >
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
    </PageWrapper>
  );
}

interface TournamentMatchCardProps {
  match: Match;
  tournament: Tournament | null;
}

function TournamentMatchCard({ match, tournament }: TournamentMatchCardProps): React.ReactElement {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "text-yellow-400";
      case "in-progress":
        return "text-blue-400";
      case "completed":
        return "text-green-400";
      case "cancelled":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Scheduled";
      case "in-progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-200 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{match.name}</h3>
          {match.roundName && <p className="text-gray-400 text-sm">{match.roundName}</p>}
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
        {match.status === "completed" && (
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {match.score.blue} - {match.score.red}
            </div>
            <div className="text-sm text-gray-400">
              {match.winner === "blue" ? match.blueTeam.name : match.redTeam.name} wins
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
              <span className="text-white">{new Date(match.scheduledTime).toLocaleDateString()}</span>
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
            onClick={() => (window.location.href = `/modules/tournaments/${tournament?.id}/matches/${match.id}`)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View Details
          </button>
          {match.status === "scheduled" && (
            <button
              onClick={() => (window.location.href = `/modules/tournaments/${tournament?.id}/matches/${match.id}/edit`)}
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
