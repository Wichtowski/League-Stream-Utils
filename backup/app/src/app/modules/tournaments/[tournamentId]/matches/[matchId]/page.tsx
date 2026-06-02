"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageWrapper } from "@lib/layout";
import { LoadingSpinner, Button } from "@lib/components/common";
import { MatchDetailPage } from "@libTournament/components/matches/MatchDetailPage";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useCurrentTournament } from "@libTournament/contexts/CurrentTournamentContext";
import { useCurrentMatch } from "@libTournament/contexts/CurrentMatchContext";

export default function MatchDetailPageWrapper(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const { currentTournament, setCurrentTournament } = useCurrentTournament();
  const { currentMatch, setCurrentMatch } = useCurrentMatch();
  const tournamentId = params.tournamentId as string;
  const matchId = params.matchId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageProps = useMemo(() => {
    return {
      title: !currentMatch ? (loading ? "Loading match..." : "Match not found") : currentMatch.name,
      subtitle: "Match Details",
      breadcrumbs: [
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: currentTournament?.name || "Loading...", href: `/modules/tournaments/${tournamentId}` },
        { label: "Matches", href: `/modules/tournaments/${tournamentId}/matches` },
        {
          label: currentMatch?.name || "Match",
          href: `/modules/tournaments/${tournamentId}/matches/${matchId}`,
          isActive: true
        }
      ],
      actions: (
        <>
          <div className="flex gap-2 flex-wrap">
            <h4 className="text-gray-400">Match:</h4>
            <Button
              target="_blank"
              href={`/modules/tournaments/${tournamentId}/matches/${matchId}/ticker`}
              size="sm"
              variant="secondary"
            >
              Ticker
            </Button>
            <Button
              target="_blank"
              href={`/modules/tournaments/${tournamentId}/matches/${matchId}/predictions`}
              size="sm"
              variant="secondary"
            >
              Predictions
            </Button>
            <Button
              href={`/modules/tournaments/${tournamentId}/matches/${matchId}/commentator-predictions`}
              size="sm"
              variant="secondary"
            >
              Commentator Predictions
            </Button>
          </div>
          <h4 className="text-gray-400">LeagueClient</h4>
          <Button
            target="_blank"
            href={`/modules/leagueclient/${tournamentId}/${matchId}/champselect`}
            size="sm"
            variant="primary"
          >
            Champ Select
          </Button>
          <Button
            target="_blank"
            href={`/modules/leagueclient/${tournamentId}/${matchId}/game`}
            size="sm"
            variant="secondary"
          >
            Game
          </Button>
        </>
      )
    };
  }, [currentTournament, currentMatch, tournamentId, matchId, loading]);

  useEffect(() => {
    setActiveModule("currentMatch");
  }, [setActiveModule]);

  useEffect(() => {
    const fetchData = async () => {
      if (!tournamentId || !matchId) return;

      try {
        const [matchResponse, tournamentResponse] = await Promise.all([
          fetch(`/api/v1/matches/${matchId}`),
          fetch(`/api/v1/tournaments/${tournamentId}`)
        ]);

        if (!matchResponse.ok || !tournamentResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [matchData, tournamentData] = await Promise.all([matchResponse.json(), tournamentResponse.json()]);

        if (!matchData.match || !tournamentData.tournament) {
          throw new Error("Invalid data received");
        }

        setCurrentMatch(matchData.match);
        setCurrentTournament(tournamentData.tournament);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournamentId, matchId, setCurrentMatch, setCurrentTournament]);

  if (loading) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading match data..." />
      </PageWrapper>
    );
  }

  if (error || !currentMatch || !currentTournament) {
    return (
      <PageWrapper>
        <div className="min-h-screen p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">Error loading match</div>
            <p className="text-gray-500">{error ? "Match not found" : ""}</p>
            <Button onClick={() => router.push(`/modules/tournaments/${tournamentId}/matches`)} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper {...pageProps}>
      <div className="min-h-screen p-6 max-w-7xl mx-auto">
        <MatchDetailPage match={currentMatch} tournament={currentTournament} />
      </div>
    </PageWrapper>
  );
}
