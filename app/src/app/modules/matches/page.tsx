"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@lib/contexts/AuthContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/components/modal";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout/PageWrapper";
import type { Match } from "@lib/types/match";
import type { Tournament } from "@lib/types/tournament";
import { tournamentStorage, LastSelectedTournament } from "@lib/utils/storage/tournament-storage";

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
    setActiveModule("matches");
  }, [setActiveModule]);

  useEffect(() => {
    const loadLastSelectedTournament = async () => {
      try {
        const lastSelected = await tournamentStorage.getLastSelectedTournament();
        if (lastSelected && (await tournamentStorage.isLastSelectedTournamentValid())) {
          setLastSelectedTournament(lastSelected);
        } else {
          await showAlert({
            type: "error",
            message: "No tournament selected. Please select a tournament first."
          });
          router.push("/modules/tournaments");
        }
      } catch (_error) {
        await showAlert({
          type: "error",
          message: "Failed to load tournament selection."
        });
        router.push("/modules/tournaments");
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
          throw new Error("Failed to fetch tournament");
        }
        const tournamentData = await tournamentResponse.json();
        setTournament(tournamentData.tournament);

        // Fetch matches
        const matchesResponse = await fetch(`/api/v1/tournaments/${lastSelectedTournament.tournamentId}/matches`);
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
  }, [lastSelectedTournament]);

  if (!user) {
    return <PageWrapper>{null}</PageWrapper>;
  }

  if (loading) {
    return (
      <PageWrapper loadingMessage="Loading matches...">
        <LoadingSpinner fullscreen text="Loading matches..." />
      </PageWrapper>
    );
  }

  if (!tournament || !lastSelectedTournament) {
    return (
      <PageWrapper
        loadingMessage="Loading tournament..."
        title="Tournament Not Found"
        subtitle="The tournament you're looking for doesn't exist or you don't have access to it."
      >
        <div className="text-center">
          <button
            onClick={() => router.push("/modules/tournaments")}
            className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Select Tournament
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={tournament ? `${tournament.name} Matches` : "Tournament Matches"}
      subtitle={tournament ? tournament.abbreviation : "Loading..."}
      actions={
        <button
          onClick={() => router.push("/modules/tournaments")}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          ← Change Tournament
        </button>
      }
      contentClassName="max-w-6xl mx-auto"
    >
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
        return "Unknown";
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {match.blueTeam.name} vs {match.redTeam.name}
          </h3>
          <p className="text-gray-400 text-sm">
            {match.blueTeam.tag} vs {match.redTeam.tag}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(match.status)}`}>
          {getStatusText(match.status)}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-400">Format:</span> {match.format}
        </div>
        <div>
          <span className="text-gray-400">Type:</span> {match.type}
        </div>
        {match.scheduledTime && (
          <div>
            <span className="text-gray-400">Scheduled:</span> {new Date(match.scheduledTime).toLocaleString()}
          </div>
        )}
        {tournament && (
          <div>
            <span className="text-gray-400">Tournament:</span> {tournament.name}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{match.blueTeam.tag}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">Blue</div>
          </div>
          <div className="text-2xl font-bold text-white">VS</div>
          <div className="text-center">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{match.redTeam.tag}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">Red</div>
          </div>
        </div>
      </div>
    </div>
  );
}
