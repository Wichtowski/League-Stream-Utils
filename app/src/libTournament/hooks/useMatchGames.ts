import { useState } from "react";
import type { Match, GameResult, MatchFormat } from "@libTournament/types/matches";
import type { Team } from "@libTeam/types";

export const useMatchGames = (
  match: Match | null,
  blueTeam: Team | null,
  redTeam: Team | null,
  originalMatch?: Match | null
) => {
  const [newGame, setNewGame] = useState<Partial<GameResult>>({
    gameNumber: 1,
    winner: undefined,
    blueScore: 0,
    redScore: 0,
    blueTeam: "",
    redTeam: ""
  });

  // Derive teamsSwapped from match data instead of managing it manually
  const teamsSwapped =
    originalMatch && match
      ? originalMatch.blueTeamId !== match.blueTeamId || originalMatch.redTeamId !== match.redTeamId
      : false;

  const getMaxGamesByFormat = (format: MatchFormat): number => {
    if (format === "BO1") return 1;
    if (format === "BO3") return 3;
    return 5;
  };

  const getMinGamesByFormat = (format: MatchFormat): number => {
    if (format === "BO1") return 1;
    if (format === "BO3") return 2;
    return 3;
  };

  const getTeamIdForSide = (game: GameResult, side: "blue" | "red"): string => {
    if (!match) return "";
    const isBlueTeamMatchBlue = blueTeam?.name && game.blueTeam === blueTeam.name;
    if (side === "blue") {
      return isBlueTeamMatchBlue ? match.blueTeamId : match.redTeamId;
    }
    return isBlueTeamMatchBlue ? match.redTeamId : match.blueTeamId;
  };

  const handleChampionPlayedChange = (
    gameNumber: number,
    side: "blue" | "red",
    playerId: string,
    championId: number,
    onUpdate: (updatedMatch: Match) => void
  ): void => {
    if (!match) return;
    const games = (match.games || []).map((g) => {
      if (g.gameNumber !== gameNumber) return g as GameResult;
      const teamId = getTeamIdForSide(g as GameResult, side);
      const updated: GameResult = {
        ...(g as GameResult),
        championsPlayed: {
          ...((g as GameResult).championsPlayed || {}),
          [teamId]: {
            ...(((g as GameResult).championsPlayed || {})[teamId] || {}),
            [playerId]: championId
          }
        }
      };
      return updated;
    });
    onUpdate({ ...match, games });
  };

  const handleAddGame = async (
    winnerOverride?: "blue" | "red",
    onUpdate?: (updatedMatch: Match) => void
  ): Promise<void> => {
    if (!match) return;
    const maxGames = getMaxGamesByFormat(match.format);
    const currentGames = match.games?.length || 0;
    if (currentGames >= maxGames) return;
    const nextGameNumber = currentGames + 1;
    const decidedWinner = winnerOverride ?? newGame.winner;
    if (!decidedWinner) return;

    const gameData = {
      ...newGame,
      _id: `game_${Date.now()}`,
      gameNumber: nextGameNumber,
      winner: decidedWinner,
      startTime: new Date(),
      completedAt: new Date(),
      blueScore: decidedWinner === "blue" ? 1 : 0,
      redScore: decidedWinner === "red" ? 1 : 0,
      blueTeam: teamsSwapped ? redTeam?.name || "" : blueTeam?.name || "",
      redTeam: teamsSwapped ? blueTeam?.name || "" : redTeam?.name || ""
    };

    const updatedGames = [...(match.games || []), gameData as GameResult];

    const newScore = updatedGames.reduce(
      (acc, g) => {
        if (g.winner === "blue") acc.blue += 1;
        if (g.winner === "red") acc.red += 1;
        return acc;
      },
      { blue: 0, red: 0 }
    );

    onUpdate?.({
      ...match,
      games: updatedGames,
      score: newScore,
      status: "in-progress"
    });

    const next = Math.min(currentGames + 2, getMaxGamesByFormat(match.format));
    setNewGame({ gameNumber: next, winner: undefined, blueScore: 0, redScore: 0, blueTeam: "", redTeam: "" });
  };

  const handleUpdateGameWinner = (
    gameNumber: number,
    winner: "blue" | "red" | "ongoing",
    onUpdate: (updatedMatch: Match) => void
  ): void => {
    if (!match) return;

    const updatedGames: GameResult[] = (match.games || []).map((g) =>
      g.gameNumber === gameNumber
        ? {
            ...g,
            winner: winner,
            blueScore: winner === "blue" ? 1 : 0,
            redScore: winner === "red" ? 1 : 0
          }
        : { ...g, winner: g.winner as "blue" | "red" | "ongoing" }
    );

    const finalGames = removeUnnecessaryGames(updatedGames, match);

    const newScore = finalGames.reduce(
      (acc, g) => {
        if (g.winner === "blue") acc.blue += 1;
        if (g.winner === "red") acc.red += 1;
        return acc;
      },
      { blue: 0, red: 0 }
    );

    onUpdate({
      ...match,
      games: finalGames,
      score: newScore,
      status: "in-progress"
    });
  };

  const handleSwapGameSides = (gameNumber: number, onUpdate: (updatedMatch: Match) => void): void => {
    if (!match) return;

    const updatedGames: GameResult[] = (match.games || []).map((g) => {
      if (g.gameNumber !== gameNumber) return { ...g, winner: g.winner as "blue" | "red" | "ongoing" };
      const newWinner = g.winner === "blue" ? "red" : "blue";

      // Swap champion data when game sides are swapped
      const swappedChampionsPlayed: { [teamId: string]: { [playerId: string]: number } } = {};
      if (g.championsPlayed) {
        // Swap the champion data between teams for this specific game
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

    const finalGames = removeUnnecessaryGames(updatedGames, match);

    const newScore = finalGames.reduce(
      (acc, g) => {
        if (g.winner === "blue") acc.blue += 1;
        if (g.winner === "red") acc.red += 1;
        return acc;
      },
      { blue: 0, red: 0 }
    );

    onUpdate({
      ...match,
      games: finalGames,
      score: newScore,
      status: "in-progress"
    });
  };

  const handleDeleteGame = (gameNumber: number, onUpdate: (updatedMatch: Match) => void): void => {
    if (!match) return;

    const updatedGames = (match.games || []).filter((g) => g.gameNumber !== gameNumber);
    const newScore = updatedGames.reduce(
      (acc, g) => {
        if (g.winner === "blue") acc.blue += 1;
        if (g.winner === "red") acc.red += 1;
        return acc;
      },
      { blue: 0, red: 0 }
    );

    onUpdate({
      ...match,
      games: updatedGames,
      score: newScore,
      status: "in-progress"
    });
  };

  const removeUnnecessaryGames = (games: GameResult[], match: Match | null): GameResult[] => {
    if (!match || games.length === 0) return games;

    const minGames = getMinGamesByFormat(match.format);
    const maxGames = getMaxGamesByFormat(match.format);

    const firstGame = games[0];
    const team1 = firstGame.blueTeam;

    const tally = games.reduce(
      (acc, g) => {
        if (g.winner === "blue") {
          if (g.blueTeam === team1) acc.team1 += 1;
          else acc.team2 += 1;
        } else if (g.winner === "red") {
          if (g.redTeam === team1) acc.team1 += 1;
          else acc.team2 += 1;
        }
        return acc;
      },
      { team1: 0, team2: 0 }
    );

    const requiredWins = Math.ceil(maxGames / 2);
    if (tally.team1 >= requiredWins || tally.team2 >= requiredWins) {
      return games.filter((g) => g.gameNumber <= minGames);
    }

    return games;
  };

  return {
    newGame,
    setNewGame,
    teamsSwapped,
    getMaxGamesByFormat,
    getMinGamesByFormat,
    getTeamIdForSide,
    handleChampionPlayedChange,
    handleAddGame,
    handleUpdateGameWinner,
    handleSwapGameSides,
    handleDeleteGame
  };
};
