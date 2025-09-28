"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@lib/contexts";
import { PageWrapper } from "@lib/layout";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { useCurrentMatch } from "@libTournament/contexts/CurrentMatchContext";
import { Match } from "@libTournament/types";
import { LoadingSpinner, Button } from "@lib/components/common";
import { CurrentMatchStatus } from "@libTournament/components";
import { useCurrentTournament } from "@/libTournament/contexts/CurrentTournamentContext";

export default function TournamentMatchesPage(): React.ReactElement {
  const params = useParams();
  const user = useUser();
  const router = useRouter();
  const { setCurrentMatch } = useCurrentMatch();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { setCurrentTournament, currentTournament } = useCurrentTournament();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tournamentId = params.tournamentId as string;
  const pageProps = useMemo(() => {
    return {
      title: !currentTournament?.name ? (loading ? "Loading Matches" : "Tournament Not Found") : "Matches",
      subtitle: `Manage matches for ${currentTournament?.abbreviation ? "for " + currentTournament?.abbreviation : ""}`,
      breadcrumbs: [
        { label: "Tournaments", href: "/modules/tournaments" }, 
        currentTournament?.name ? { label: currentTournament.name , href: `/modules/tournaments/${tournamentId}` } : null,
        { label: "Matches", href: `/modules/tournaments/${tournamentId}/matches`, isActive: true }],
    }
  }, [currentTournament, tournamentId, loading]);

  useEffect(() => {
    if (!tournamentId || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        if (!currentTournament || currentTournament._id !== tournamentId) {
          const tournamentResponse = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}`);
          if (!tournamentResponse.ok) {
            throw new Error("Failed to fetch tournament");
          }
          
          // Check if response is HTML (redirect to login)
          const contentType = tournamentResponse.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
            throw new Error("Authentication required - redirecting to login");
          }
          
          const tournamentData = await tournamentResponse.json();
          setCurrentTournament(tournamentData.tournament);
        }

        const matchesResponse = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/matches`);
        if (!matchesResponse.ok) {
          throw new Error("Failed to fetch matches");
        }
        
        // Check if response is HTML (redirect to login)
        const contentType = matchesResponse.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("Authentication required - redirecting to login");
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
  }, [tournamentId, user, authenticatedFetch, currentTournament, setCurrentTournament]);

  if (!user) {
    return <PageWrapper {...pageProps} requireAuth={true}>{null}</PageWrapper>;
  }

  if (loading) {
    return (
      <PageWrapper
        {...pageProps}
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
      <PageWrapper {...pageProps}>
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">{error}</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!currentTournament) {
    return (
      <PageWrapper {...pageProps} >
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">Tournament not found</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const canCreateMatches = user._id === currentTournament.userId || user.isAdmin;

  const handleSetCurrentMatch = async (matchId: string): Promise<void> => {
    try {
      const match = matches.find((m) => m._id === matchId);
      if (!match) return;

      await setCurrentMatch(match);
    } catch (error) {
      console.error("Failed to save last selected match:", error);
    }
  };

  return (
    <PageWrapper
      {...pageProps}
    >
      <div className="min-h-screen p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Current Match Status */}
          <div className="lg:col-span-2">
            <CurrentMatchStatus />
          </div>

          {/* Matches List */}
          <div className="lg:col-span-3">
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
                    <div key={match._id} className="flex items-center justify-between p-3 bg-gray-800 rounded-md">
                      <div className="flex-1">
                        <div className="text-white font-medium">{match.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {match.format} • {match.status}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => router.push(`/modules/tournaments/${tournamentId}/matches/${match._id}`)}
                          size="sm"
                          variant="secondary"
                        >
                          Edit
                        </Button>
                        <Button onClick={() => handleSetCurrentMatch(match._id)} size="sm" variant="secondary">
                          Set as Current
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
