import type { PlayerStatsDoc } from "@lib/database/models";

type NormalizedStats = NonNullable<PlayerStatsDoc["stats"]>;

export const usePlayerStats = (playerStats: PlayerStatsDoc[], setPlayerStats: (stats: PlayerStatsDoc[]) => void) => {
  const normalizeStats = (s: PlayerStatsDoc): NormalizedStats => ({
    ...s.stats,
    cs: s.stats?.cs ?? 0,
    csPerMinute: s.stats?.csPerMinute ?? 0,
    gold: s.stats?.gold ?? 0,
    goldPerMinute: s.stats?.goldPerMinute ?? 0,
    damageDealt: s.stats?.damageDealt ?? 0,
    damageTaken: s.stats?.damageTaken ?? 0,
    visionScore: s.stats?.visionScore ?? 0,
    wardsPlaced: s.stats?.wardsPlaced ?? 0,
    wardsDestroyed: s.stats?.wardsDestroyed ?? 0,
    firstBlood: s.stats?.firstBlood ?? false,
    firstTower: s.stats?.firstTower ?? false,
    objectiveParticipation: s.stats?.objectiveParticipation,
    kda: {
      kills: s.stats?.kda?.kills ?? 0,
      deaths: s.stats?.kda?.deaths ?? 0,
      assists: s.stats?.kda?.assists ?? 0
    }
  });

  const updatePlayerStat = (
    target: PlayerStatsDoc,
    apply: (ns: NormalizedStats) => NormalizedStats
  ): void => {
    const updatedStats = playerStats.map((row: PlayerStatsDoc) =>
      row.playerId === target.playerId && row.gameId === target.gameId && row.championId === target.championId
        ? { ...row, stats: apply(normalizeStats(row)) }
        : row
    );
    setPlayerStats(updatedStats);
  };

  return {
    normalizeStats,
    updatePlayerStat
  };
};
