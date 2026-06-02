import { useState, useEffect, useRef } from "react";
import type { Match, Tournament } from "@libTournament/types";
import type { PlayerStatsDoc } from "@lib/database/models";

export const useMatchData = (tournamentId: string, matchId: string) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStatsDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedData = useRef(false);

  const fetchMatchData = async (tournamentId: string, matchId: string) => {
    try {
      const matchResponse = await fetch(`/api/v1/matches/${matchId}`);
      if (!matchResponse.ok) throw new Error("Failed to fetch match");
      const matchData = await matchResponse.json();

      if (!matchData.match) {
        throw new Error("Invalid match data received");
      }

      const matchWithDefaults = {
        ...matchData.match,
        games: matchData.match.games || [],
        commentators: matchData.match.commentators || [],
        predictions: matchData.match.predictions || []
      };
      setMatch(matchWithDefaults);

      const tournamentResponse = await fetch(`/api/v1/tournaments/${tournamentId}`);
      if (!tournamentResponse.ok) throw new Error("Failed to fetch tournament");
      const tournamentData = await tournamentResponse.json();

      if (!tournamentData.tournament) {
        throw new Error("Invalid tournament data received");
      }

      setTournament(tournamentData.tournament);

      try {
        const statsResponse = await fetch(`/api/v1/player-stats?matchId=${matchId}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setPlayerStats(statsData.stats || []);
        } else {
          setPlayerStats([]);
        }
      } catch (statsError) {
        console.warn("Failed to fetch player stats:", statsError);
        setPlayerStats([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
      hasFetchedData.current = true;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const resolveParams = async () => {
      try {
        if (isMounted && !hasFetchedData.current) {
          await fetchMatchData(tournamentId, matchId);
        }
      } catch (_error) {
        // Handle error
      }
    };

    resolveParams();

    return () => {
      isMounted = false;
    };
  }, [tournamentId, matchId]);

  return {
    match,
    setMatch,
    tournament,
    playerStats,
    setPlayerStats,
    loading,
    error,
    fetchMatchData
  };
};
