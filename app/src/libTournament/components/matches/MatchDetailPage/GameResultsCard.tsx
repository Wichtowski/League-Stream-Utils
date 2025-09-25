import React from "react";
import { Button } from "@lib/components/common";
import type { Match, GameResult, MatchFormat } from "@libTournament/types/matches";
import type { Team } from "@lib/types/team";
import type { Champion } from "@lib/types/game";

interface GameResultsCardProps {
  match: Match;
  editing: boolean;
  saving: boolean;
  blueTeam: Team | null;
  redTeam: Team | null;
  champions: Champion[];
  teamsSwapped: boolean;
  onTeamsSwappedChange: (swapped: boolean) => void;
  onAddGame: (winnerOverride?: "blue" | "red") => Promise<void>;
  onUpdateGameWinner: (gameNumber: number, winner: "blue" | "red" | "ongoing") => void;
  onSwapGameSides: (gameNumber: number) => void;
  onDeleteGame: (gameNumber: number) => void;
  onChampionPlayedChange: (gameNumber: number, side: "blue" | "red", playerId: string, championId: number) => void;
  getTeamIdForSide: (game: GameResult, side: "blue" | "red") => string;
  getMaxGamesByFormat: (format: MatchFormat) => number;
  getMinGamesByFormat: (format: MatchFormat) => number;
  teamWins: { team1Wins: number; team2Wins: number };
}

export const GameResultsCard: React.FC<GameResultsCardProps> = ({
  match,
  editing,
  saving,
  blueTeam,
  redTeam,
  champions,
  teamsSwapped,
  onTeamsSwappedChange,
  onAddGame,
  onUpdateGameWinner,
  onSwapGameSides,
  onDeleteGame,
  onChampionPlayedChange,
  getTeamIdForSide,
  getMaxGamesByFormat,
  getMinGamesByFormat,
  teamWins
}) => {
  const maxGames = getMaxGamesByFormat(match.format);
  const minGames = getMinGamesByFormat(match.format);
  const existing = match.games || [];
  
  const requiredWins = Math.ceil(maxGames / 2);
  const seriesDecided = teamWins.team1Wins >= requiredWins || teamWins.team2Wins >= requiredWins;
  const displayCount = seriesDecided 
    ? existing.length 
    : Math.min(maxGames, Math.max(minGames, existing.length + 1));
  const slots = Array.from({ length: displayCount }, (_, i) => i + 1);
  const firstPending = slots.find(num => !existing.find(g => g.gameNumber === num));

  if (slots.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="text-center py-8 text-gray-400">No games played yet</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Game Results</h3>
        {editing && (
          <Button
            onClick={() => onAddGame()}
            size="sm"
            variant="primary"
            disabled={(
              (teamWins.team1Wins >= Math.ceil(getMaxGamesByFormat(match.format) / 2)) ||
              (teamWins.team2Wins >= Math.ceil(getMaxGamesByFormat(match.format) / 2)) ||
              (teamWins.team1Wins + teamWins.team2Wins >= getMaxGamesByFormat(match.format)) || 
              saving
            )}
          >
            Add Series Game
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {slots.map((num) => {
          const game = existing.find(g => g.gameNumber === num);
          if (!game) {
            if (editing && firstPending === num) {
              return (
                <div key={`editor_${num}`} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-300">Game {num}</span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-blue-100">Editing</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-3 items-center gap-2">
                      <div className="text-gray-400 text-xs text-left">Blue Side</div>
                      <div />
                      <div className="text-gray-400 text-xs text-right">Red Side</div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <div className="text-white text-sm truncate text-left">{teamsSwapped ? redTeam?.name : blueTeam?.name}</div>
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => onTeamsSwappedChange(!teamsSwapped)}
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white border border-gray-500"
                          aria-label="Swap teams"
                          title="Swap teams"
                        >
                          ⇄
                        </button>
                      </div>
                      <div className="text-white text-sm truncate text-right">{teamsSwapped ? blueTeam?.name : redTeam?.name}</div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <div className="flex items-center justify-start">
                        <input
                          type="checkbox"
                          onChange={async () => {
                            await onAddGame("blue");
                          }}
                          className="h-4 w-4"
                        />
                      </div>
                      <div />
                      <div className="flex items-center justify-end">
                        <input
                          type="checkbox"
                          onChange={async () => {
                            await onAddGame("red");
                          }}
                          className="h-4 w-4"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={`placeholder_${num}`} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-300">Game {num}</span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-200">Pending</span>
                  </div>
                  <div className="text-sm text-gray-400">—</div>
                </div>
              </div>
            );
          }
          return (
            <div key={game._id || `game_${num}`} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-300">Game {game.gameNumber}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                          game.winner === "blue" 
                            ? "bg-blue-600 text-blue-100" 
                            : game.winner === "red" 
                            ? "bg-red-600 text-red-100"
                            : "bg-gray-600 text-gray-200"
                        }`}
                    >
                      {game.winner === "blue" ? "Blue Win" : game.winner === "red" ? "Red Win" : "Ongoing"}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  {game.blueScore} - {game.redScore}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 items-center">
                <div className="text-white text-sm truncate text-left">{game.blueTeam}</div>
                <div className="text-center text-gray-400 text-xs">VS</div>
                <div className="text-white text-sm truncate text-right">{game.redTeam}</div>
              </div>
              {editing && (
                <div className="mt-3 grid grid-cols-3 items-center gap-2">
                  <div className="text-gray-400 text-xs text-left">Blue Side</div>
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => onSwapGameSides(num)}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white border border-gray-500"
                      aria-label="Swap sides for this game"
                      title="Swap sides for this game"
                    >
                      ⇄
                    </button>
                  </div>
                  <div className="text-gray-400 text-xs text-right">Red Side</div>
                  <div className="flex items-center justify-start">
                    <input
                      type="checkbox"
                      checked={game.winner === "blue"}
                      onChange={() => {
                        if (game.winner === "blue") {
                          onUpdateGameWinner(num, "ongoing");
                        } else {
                          onUpdateGameWinner(num, "blue");
                        }
                      }}
                      className="h-4 w-4"
                    />
                  </div>
                  <div />
                  <div className="flex items-center justify-end">
                    <input
                      type="checkbox"
                      checked={game.winner === "red"}
                      onChange={() => {
                        if (game.winner === "red") {
                          onUpdateGameWinner(num, "ongoing");
                        } else {
                          onUpdateGameWinner(num, "red");
                        }
                      }}
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              )}
              {editing && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-2">Blue side champions</div>
                      <div className="space-y-2">
                        {(blueTeam?.players?.main || []).slice(0,5).map((p) => {
                          const teamId = getTeamIdForSide(game, "blue");
                          const current = game.championsPlayed?.[teamId]?.[p._id];
                          return (
                            <div key={`blue_${game.gameNumber}_${p._id}`} className="flex items-center justify-between gap-2">
                              <span className="text-sm text-gray-300 truncate">{p.inGameName || p.tag}</span>
                              <select
                                className="w-40 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                                value={current ?? ""}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChampionPlayedChange(game.gameNumber, "blue", p._id, parseInt(e.target.value))}
                              >
                                <option value="">Select champion</option>
                                {champions.map((c) => (
                                  <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-2 text-right">Red side champions</div>
                      <div className="space-y-2">
                        {(redTeam?.players?.main || []).slice(0,5).map((p) => {
                          const teamId = getTeamIdForSide(game, "red");
                          const current = game.championsPlayed?.[teamId]?.[p._id];
                          return (
                            <div key={`red_${game.gameNumber}_${p._id}`} className="flex items-center justify-between gap-2">
                              <span className="text-sm text-gray-300 truncate">{p.inGameName || p.tag}</span>
                              <select
                                className="w-40 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                                value={current ?? ""}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChampionPlayedChange(game.gameNumber, "red", p._id, parseInt(e.target.value))}
                              >
                                <option value="">Select champion</option>
                                {champions.map((c) => (
                                  <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {editing && num > getMinGamesByFormat(match.format) && (
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={() => onDeleteGame(num)}
                    size="sm"
                    variant="destructive"
                    className="text-xs"
                  >
                    Delete Game
                  </Button>
                </div>
              )}
              {game.duration && (
                <div className="text-xs text-gray-500 mt-2">
                  Duration: {Math.floor(game.duration / 60)}:{(game.duration % 60).toString().padStart(2, "0")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
