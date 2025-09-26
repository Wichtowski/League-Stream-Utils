"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TickerDisplay } from "@libTournament/components/ticker/TickerDisplay";
import { Tournament, Match } from "@libTournament/types";
import { Team } from "@libTeam/types";

export default function MatchTickerPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const matchId = params.matchId as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch tournament data
        const tournamentResponse = await fetch(`/api/v1/tournaments/${tournamentId}`);
        if (!tournamentResponse.ok) {
          throw new Error("Failed to fetch tournament");
        }
        const tournamentData = await tournamentResponse.json();
        setTournament(tournamentData);

        // Fetch match data
        const matchResponse = await fetch(`/api/v1/tournaments/${tournamentId}/matches/${matchId}`);
        if (!matchResponse.ok) {
          throw new Error("Failed to fetch match");
        }
        const matchData = await matchResponse.json();
        setMatch(matchData);

        // Fetch team data if match has teams
        if (matchData.team1Id) {
          const team1Response = await fetch(`/api/v1/teams/${matchData.team1Id}`);
          if (team1Response.ok) {
            const team1Data = await team1Response.json();
            setTeam1(team1Data);
          }
        }

        if (matchData.team2Id) {
          const team2Response = await fetch(`/api/v1/teams/${matchData.team2Id}`);
          if (team2Response.ok) {
            const team2Data = await team2Response.json();
            setTeam2(team2Data);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId && matchId) {
      fetchData();
    }
  }, [tournamentId, matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading match Ticker...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  if (!tournament || !match) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Tournament or match not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <TickerDisplay tournament={tournament} match={match} team1={team1} team2={team2} />
    </div>
  );
}
