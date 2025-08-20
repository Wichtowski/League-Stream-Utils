"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Match } from "@lib/types/match";
import type { Tournament } from "@lib/types/tournament";
import { useUser } from "@lib/contexts";
import { PageWrapper } from "@lib/layout";
import { CurrentMatchStatus } from "@libTournament/components";
import { LoadingSpinner, Button } from "@lib/components/common";

interface TournamentMatchesPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default function TournamentMatchesPage({ params }: TournamentMatchesPageProps): React.ReactElement {
  const user = useUser();
  const router = useRouter();

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

  if (loading) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Tournaments", href: "/modules/tournaments" },
          { label: "Matches", href: `/modules/tournaments/${tournamentId}/matches`, isActive: true }
        ]}
      >
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <LoadingSpinner />
            <div className="text-white mt-4">Loading tournament data...</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Tournaments", href: "/modules/tournaments" },
          { label: "Matches", href: `/modules/tournaments/${tournamentId}/matches`, isActive: true }
        ]}
      >
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">{error}</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!tournament) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Tournaments", href: "/modules/tournaments" },
          { label: "Matches", href: `/modules/tournaments/${tournamentId}/matches`, isActive: true }
        ]}
      >
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">Tournament not found</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const canCreateMatches = user.id === tournament.userId || user.isAdmin;

  return (
    <PageWrapper
      title="Matches"
      subtitle={tournament.abbreviation}
      breadcrumbs={[
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: tournament.name, href: `/modules/tournaments/${tournamentId}` },
        { label: "Matches", href: `/modules/tournaments/${tournamentId}/matches`, isActive: true }
      ]}
    >
      <div className="min-h-screen p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Match Status */}
          <div className="lg:col-span-1">
            <CurrentMatchStatus />
          </div>

          {/* Matches List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Tournament Matches</h2>
                {canCreateMatches && (
                  <Button onClick={() => router.push(`/modules/tournaments/${tournamentId}/matches/create`)} size="sm">
                    Create Match
                  </Button>
                )}
              </div>

              {matches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-3">No matches created yet</div>
                  {canCreateMatches ? (
                    <Button onClick={() => router.push(`/modules/tournaments/${tournamentId}/matches/create`)}>
                      Create First Match
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500">Contact the tournament organizer to create matches</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-md">
                      <div className="flex-1">
                        <div className="text-white font-medium">{match.name}</div>
                        <div className="text-sm text-gray-400">
                          {match.blueTeam.name} vs {match.redTeam.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {match.format} • {match.status}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            match.status === "in-progress"
                              ? "bg-yellow-600 text-yellow-100"
                              : match.status === "completed"
                                ? "bg-green-600 text-green-100"
                                : match.status === "cancelled"
                                  ? "bg-red-600 text-red-100"
                                  : "bg-gray-600 text-gray-100"
                          }`}
                        >
                          {match.status}
                        </span>
                        <Button
                          onClick={() => router.push(`/modules/tournaments/${tournamentId}/matches/${match.id}`)}
                          size="sm"
                          variant="secondary"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
