"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@lib/layout";
import { LoadingSpinner, Button } from "@lib/components/common";
import { MatchDetailPage } from "@libTournament/components/matches/MatchDetailPage";
import type { Match, Tournament } from "@lib/types";

interface MatchDetailPageProps {
  params: Promise<{
    tournamentId: string;
    matchID: string;
    matchId?: string;
  }>;
}

export default function MatchDetailPageWrapper({ params }: MatchDetailPageProps): React.ReactElement {
  const router = useRouter();
  const [tournamentId, setTournamentId] = useState<string>("");
  const [matchId, setMatchId] = useState<string>("");
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTournamentId(resolvedParams.tournamentId);
      setMatchId(resolvedParams.matchId ?? resolvedParams.matchID);
    };
    resolveParams();
  }, [params]);

  // Fetch match and tournament data for PageWrapper
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

        const [matchData, tournamentData] = await Promise.all([
          matchResponse.json(),
          tournamentResponse.json()
        ]);

        if (!matchData.match || !tournamentData.tournament) {
          throw new Error("Invalid data received");
        }

        setMatch(matchData.match);
        setTournament(tournamentData.tournament);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournamentId, matchId]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-screen p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <LoadingSpinner />
            <div className="text-white mt-4">Loading match data...</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !match || !tournament) {
    return (
      <PageWrapper>
        <div className="min-h-screen p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">Error loading match</div>
            <p className="text-gray-500">{error || "Match not found"}</p>
            <Button onClick={() => router.push(`/modules/tournaments/${tournament?._id}/matches`)} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={match.name}
      subtitle={`${tournament.name} - Match Details`}
      breadcrumbs={[
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: tournament.name, href: `/modules/tournaments/${tournament._id}` },
        { label: "Matches", href: `/modules/tournaments/${tournament._id}/matches` },
        { label: match.name, href: `/modules/tournaments/${tournament._id}/matches/${match._id}`, isActive: true }
      ]}
      actions={
        <>
          <span className="text-gray-400">LeagueClient</span>
          <Button target="_blank" href={`/modules/leagueclient/${tournament._id}/${match._id}/champselect`} size="sm" variant="primary">
            Open Champ Select
          </Button>
          <Button target="_blank" href={`/modules/leagueclient/${tournament._id}/${match._id}/game`} size="sm" variant="secondary">
            Open Game
          </Button>
        </>
      }
    >
      <div className="min-h-screen p-6 max-w-7xl mx-auto">
        <MatchDetailPage params={params} match={match} tournament={tournament} />
      </div>
    </PageWrapper>
  );
}
