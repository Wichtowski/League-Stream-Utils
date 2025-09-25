import type { GameResult } from "@libTournament/types/matches";

export const getTeamWins = (games: GameResult[]): { team1Wins: number; team2Wins: number } => {
  if (!games || games.length === 0) return { team1Wins: 0, team2Wins: 0 };
  
  // Get the team names from the first game to identify which team is which
  const firstGame = games[0];
  const team1 = firstGame.blueTeam;
  const _team2 = firstGame.redTeam;
  
  let team1Wins = 0;
  let team2Wins = 0;
  
  games.forEach(game => {
    if (game.winner === "blue") {
      // Blue team won this game
      if (game.blueTeam === team1) {
        team1Wins++;
      } else {
        team2Wins++;
      }
    } else if (game.winner === "red") {
      // Red team won this game
      if (game.redTeam === team1) {
        team1Wins++;
      } else {
        team2Wins++;
      }
    }
  });
  
  return { team1Wins, team2Wins };
};
