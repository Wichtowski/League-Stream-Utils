import { useState, useEffect } from "react";
import type { Team } from "@libTeam/types";
import type { Match, GameResult } from "@libTournament/types/matches";

export const useMatchTeams = (
  match: Match | null
): {
  blueTeam: Team | null;
  setBlueTeam: (team: Team | null) => void;
  redTeam: Team | null;
  setRedTeam: (team: Team | null) => void;
  handleSwapTeams: (onUpdate: (updatedMatch: Match) => void) => void;
} => {
  const [blueTeam, setBlueTeam] = useState<Team | null>(null);
  const [redTeam, setRedTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (match?.blueTeamId) {
      fetch(`/api/v1/teams/${match.blueTeamId}`)
        .then((res) => res.json())
        .then((data) => setBlueTeam(data.team))
        .catch(() => setBlueTeam(null));
    } else {
      setBlueTeam(null);
    }
  }, [match?.blueTeamId]);

  useEffect(() => {
    if (match?.redTeamId) {
      fetch(`/api/v1/teams/${match.redTeamId}`)
        .then((res) => res.json())
        .then((data) => setRedTeam(data.team))
        .catch(() => setRedTeam(null));
    } else {
      setRedTeam(null);
    }
  }, [match?.redTeamId]);

  const handleSwapTeams = (onUpdate: (updatedMatch: Match) => void): void => {
    if (!match) return;

    const swappedGames: GameResult[] = (match.games || []).map((g) => {
      const newWinner = g.winner === "blue" ? "red" : g.winner === "red" ? "blue" : "ongoing";

      // Swap champion data when teams are swapped
      const swappedChampionsPlayed: { [teamId: string]: { [playerId: string]: number } } = {};
      if (g.championsPlayed) {
        // Swap the champion data between teams
        const blueTeamChampions = g.championsPlayed[match.blueTeamId] || {};
        const redTeamChampions = g.championsPlayed[match.redTeamId] || {};

        // Map blue team champions to red team ID and vice versa
        swappedChampionsPlayed[match.redTeamId] = blueTeamChampions;
        swappedChampionsPlayed[match.blueTeamId] = redTeamChampions;
      }

      return {
        ...g,
        winner: newWinner,
        blueScore: newWinner === "blue" ? 1 : 0,
        redScore: newWinner === "red" ? 1 : 0,
        blueTeam: g.redTeam,
        redTeam: g.blueTeam,
        championsPlayed: swappedChampionsPlayed
      } as GameResult;
    });

    const newScore = swappedGames.reduce(
      (acc, g) => {
        if (g.winner === "blue") acc.blue += 1;
        if (g.winner === "red") acc.red += 1;
        return acc;
      },
      { blue: 0, red: 0 }
    );

    const updated: Match = {
      ...match,
      blueTeamId: match.redTeamId,
      redTeamId: match.blueTeamId,
      games: swappedGames,
      score: newScore
    } as Match;

    onUpdate(updated);
  };

  return {
    blueTeam,
    setBlueTeam,
    redTeam,
    setRedTeam,
    handleSwapTeams
  };
};
