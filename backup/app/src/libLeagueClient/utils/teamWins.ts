import { GameResult, Match } from "@libTournament/types";

export const getTeamWins = (games: GameResult[], match: Match): { team1Wins: number; team2Wins: number } => {
  if (!games || games.length === 0) return { team1Wins: 0, team2Wins: 0 };

  let team1Wins = 0;
  let team2Wins = 0;

  games.forEach((game) => {
    if (game.winner === "blue") {
      // Blue team won this game - check which team is on blue side
      const blueTeamId = getTeamIdForSide(game, "blue", match);
      if (blueTeamId === match.blueTeamId) {
        team1Wins++;
      } else {
        team2Wins++;
      }
    } else if (game.winner === "red") {
      // Red team won this game - check which team is on red side
      const redTeamId = getTeamIdForSide(game, "red", match);
      if (redTeamId === match.blueTeamId) {
        team1Wins++;
      } else {
        team2Wins++;
      }
    }
  });

  return { team1Wins, team2Wins };
};

// Helper function to get team ID for a side (copied from useMatchGames)
const getTeamIdForSide = (game: GameResult, side: "blue" | "red", match: Match): string => {
  if (!match) return "";
  
  // If game team data is empty, use match's default team assignments
  if (!game.blueTeam || game.blueTeam === '' || !game.redTeam || game.redTeam === '') {
    return side === "blue" ? match.blueTeamId : match.redTeamId;
  }
  
  // For games with proper team data, determine which team is on which side
  const isBlueTeamMatchBlue = game.blueTeam === match.blueTeamId;
  if (side === "blue") {
    return isBlueTeamMatchBlue ? match.blueTeamId : match.redTeamId;
  }
  return isBlueTeamMatchBlue ? match.redTeamId : match.blueTeamId;
};
