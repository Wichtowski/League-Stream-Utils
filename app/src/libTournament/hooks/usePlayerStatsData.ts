import { useState, useEffect } from "react";
import type { PlayerStatsDoc } from "@lib/database/models";

export const usePlayerStatsData = (matchId: string) => {
  const [playerStats, setPlayerStats] = useState<PlayerStatsDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (!matchId) {
        setLoading(false);
        return;
      }

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
        setError("Failed to fetch player stats");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerStats();
  }, [matchId]);

  return {
    playerStats,
    setPlayerStats,
    loading,
    error
  };
};
