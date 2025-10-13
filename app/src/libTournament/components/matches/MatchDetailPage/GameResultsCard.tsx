import React, { useEffect, useState } from "react";
import { Button } from "@lib/components/common";
import type { Match, GameResult, MatchFormat } from "@libTournament/types/matches";
import type { Team } from "@libTeam/types";
import type { Champion } from "@lib/types/game";
import type { PlayerRole } from "@lib/types/common";

interface GameResultsCardProps {
  match: Match;
  editing: boolean;
  saving: boolean;
  blueTeam: Team | null;
  redTeam: Team | null;
  champions: Champion[];
  teamsSwapped: boolean;
  onSwapTeams: () => void;
  onAddGame: (winnerOverride?: "blue" | "red") => Promise<void>;
  onUpdateGameWinner: (gameNumber: number, winner: "blue" | "red" | "ongoing") => void;
  onSwapGameSides: (gameNumber: number) => void;
  onDeleteGame: (gameNumber: number) => void;
  onChampionPlayedChange: (gameNumber: number, side: "blue" | "red", playerId: string, championId: number) => void;
  getTeamIdForSide: (game: GameResult, side: "blue" | "red") => string;
  getMaxGamesByFormat: (format: MatchFormat) => number;
  getMinGamesByFormat: (format: MatchFormat) => number;
  teamWins: { team1Wins: number; team2Wins: number };
  onUpdateGames: (games: GameResult[]) => void;
}

export const GameResultsCard: React.FC<GameResultsCardProps> = ({
  match,
  editing,
  saving,
  blueTeam,
  redTeam,
  champions,
  teamsSwapped,
  onSwapTeams,
  onAddGame,
  onUpdateGameWinner,
  onSwapGameSides,
  onDeleteGame,
  onChampionPlayedChange,
  getTeamIdForSide,
  getMaxGamesByFormat,
  getMinGamesByFormat,
  teamWins,
  onUpdateGames
}) => {
  const [gameOrder, setGameOrder] = useState<Record<string, Array<{ _id: string; inGameName?: string; tag: string }>>>(
    {}
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingGame, setEditingGame] = useState<number | null>(null);
  const maxGames = getMaxGamesByFormat(match.format);
  const minGames = getMinGamesByFormat(match.format);
  const existing = match.games || [];

  useEffect(() => {
    // Don't update gameOrder if we're currently updating
    if (isUpdating) {
      return;
    }
    

    setGameOrder((prev) => {
      let changed = false;
      const seed: Record<string, Array<{ _id: string; inGameName?: string; tag: string }>> = { ...prev };
      const _addIfMissing = (
        key: string,
        list: Array<{ _id: string; inGameName?: string; tag: string }> | undefined
      ): void => {
        if (!seed[key] && list && list.length) {
          seed[key] = list.slice(0, 5);
          changed = true;
        }
      };
      const games = match.games || [];
      games.forEach((g) => {
        const blueId = getTeamIdForSide(g, "blue");
        const redId = getTeamIdForSide(g, "red");
        const resolveOrder = (
          ids: string[] | undefined,
          teamPlayers: Array<{ _id: string; inGameName?: string; tag: string }> | undefined
        ): Array<{ _id: string; inGameName?: string; tag: string }> | undefined => {
          if (!ids || !teamPlayers) return undefined;
          const map = new Map(teamPlayers.map((p) => [p._id, p] as const));
          const resolved = ids.map((id) => map.get(id)).filter(Boolean) as Array<{
            _id: string;
            inGameName?: string;
            tag: string;
          }>;
          return resolved.length ? resolved : undefined;
        };

        // Get the actual team rosters based on current team assignments
        const blueRoster = (blueId === match.blueTeamId ? blueTeam?.players?.main : redTeam?.players?.main) as
          | Array<{ _id: string; inGameName?: string; tag: string }>
          | undefined;
        const redRoster = (redId === match.blueTeamId ? blueTeam?.players?.main : redTeam?.players?.main) as
          | Array<{ _id: string; inGameName?: string; tag: string }>
          | undefined;

        // Get saved player orders for each team
        const blueFromSaved = resolveOrder(
          (g as unknown as { playerSwapOrder?: Record<string, string[]> }).playerSwapOrder?.[blueId],
          blueRoster
        );
        const redFromSaved = resolveOrder(
          (g as unknown as { playerSwapOrder?: Record<string, string[]> }).playerSwapOrder?.[redId],
          redRoster
        );

        // Use team ID keys to match PlayerSlot component
        const blueKey = `${g.gameNumber}:${blueId}`;
        const redKey = `${g.gameNumber}:${redId}`;
        
        // Always update the gameOrder with the current team assignments
        // This ensures that when sides are swapped, the gameOrder reflects the new assignments
        if (blueRoster && blueRoster.length > 0) {
          seed[blueKey] = blueFromSaved || blueRoster;
          changed = true;
        }
        if (redRoster && redRoster.length > 0) {
          seed[redKey] = redFromSaved || redRoster;
          changed = true;
        }
      });
      const maxG: number = match.format === "BO1" ? 1 : match.format === "BO3" ? 3 : 5;
      for (let i = 1; i <= maxG; i++) {
        const _g = games.find((x) => x.gameNumber === i);
        
        // Always initialize gameOrder for all games, not just missing ones
        if (!seed[`${i}:${match.blueTeamId}`] && blueTeam?.players?.main && blueTeam.players.main.length > 0) {
          seed[`${i}:${match.blueTeamId}`] = blueTeam.players.main.slice(0, 5);
          changed = true;
        }
        if (!seed[`${i}:${match.redTeamId}`] && redTeam?.players?.main && redTeam.players.main.length > 0) {
          seed[`${i}:${match.redTeamId}`] = redTeam.players.main.slice(0, 5);
          changed = true;
        }
      }
      
      return changed ? seed : prev;
    });
  }, [
    match.games,
    match.blueTeamId,
    match.redTeamId,
    blueTeam?.players?.main,
    redTeam?.players?.main,
    match.format,
    getTeamIdForSide,
    isUpdating
  ]);

  // Position-based player swapping
  // Handle side swapping with player order preservation
  const handleSideSwapWithPlayerOrder = async (gameNumber: number) => {
    const game = match.games?.find(g => g.gameNumber === gameNumber);
    if (!game) return;

    // Set updating flag to prevent useEffect from interfering
    setIsUpdating(true);

    try {
      // Get current team assignments
      const currentBlueTeamId = getTeamIdForSide(game, "blue");
      const currentRedTeamId = getTeamIdForSide(game, "red");

      // Get current player orders using team ID keys
      const blueKey = `${gameNumber}:${currentBlueTeamId}`;
      const redKey = `${gameNumber}:${currentRedTeamId}`;
      const currentBlueOrder = gameOrder[blueKey] || [];
      const currentRedOrder = gameOrder[redKey] || [];


      // After swapping sides, the team assignments will be reversed
      // So we need to update the gameOrder to reflect the new team assignments
      setGameOrder((prev) => {
        const newGameOrder = { ...prev };
        
        // After side swap, the team IDs will be reversed
        // So we need to create new keys with the swapped team IDs
        const newBlueKey = `${gameNumber}:${currentRedTeamId}`;
        const newRedKey = `${gameNumber}:${currentBlueTeamId}`;
        
        // The blue side will now have the red team's players
        // The red side will now have the blue team's players
        newGameOrder[newBlueKey] = currentRedOrder;
        newGameOrder[newRedKey] = currentBlueOrder;
        
        // Remove the old keys to avoid confusion
        delete newGameOrder[blueKey];
        delete newGameOrder[redKey];
        
        return newGameOrder;
      });

      // Call the original side swap function
      onSwapGameSides(gameNumber);
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } finally {
      // Reset updating flag after a short delay
      setTimeout(() => {
        setIsUpdating(false);
      }, 200);
    }
  };

  const handlePositionSwap = async (teamId: string, gameNumber: number, currentPlayerId: string, targetPlayerId: string) => {
    if (currentPlayerId === targetPlayerId) return;
    
    // Set updating flag to prevent useEffect from interfering
    setIsUpdating(true);

    try {
      // Use the same key format as PlayerSlot component
      const key = `${gameNumber}:${teamId}`;
      
      // Update the game order by swapping positions
      setGameOrder((prev) => {
        const current = prev[key] || [];
        const idx1 = current.findIndex((p) => p._id === currentPlayerId);
        const idx2 = current.findIndex((p) => p._id === targetPlayerId);
        if (idx1 === -1 || idx2 === -1) return prev;
        const copy = [...current];
        [copy[idx1], copy[idx2]] = [copy[idx2], copy[idx1]];
        return { ...prev, [key]: copy };
      });

      // Update only the specific game with new player order
      const updatedGames: GameResult[] = (match.games || []).map((g) => {
        if (g.gameNumber !== gameNumber) return g;
        
        const existing: Record<string, string[]> =
          (g as unknown as { playerSwapOrder?: Record<string, string[]> }).playerSwapOrder || {};
        
        // Get the current order for this specific game and team
        const currentOrder = gameOrder[key]?.map(p => p._id) || [];
        const newOrder = [...currentOrder];
        
        // Find and swap the players in the order
        const idx1 = newOrder.indexOf(currentPlayerId);
        const idx2 = newOrder.indexOf(targetPlayerId);
        if (idx1 !== -1 && idx2 !== -1) {
          [newOrder[idx1], newOrder[idx2]] = [newOrder[idx2], newOrder[idx1]];
        }
        
        return { ...g, playerSwapOrder: { ...existing, [teamId]: newOrder } } as GameResult;
      });
      
      onUpdateGames(updatedGames);
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } finally {
      // Reset updating flag after a short delay
      setTimeout(() => {
        setIsUpdating(false);
      }, 200);
    }
  };

  const _swapPlayersInTeam = async (player1Id: string, player2Id: string, teamId: string) => {
    // Prevent swapping the same player
    if (player1Id === player2Id) {
      return;
    }

    try {
      // Get current team data
      const teamResponse = await fetch(`/api/v1/teams/${teamId}`);
      if (!teamResponse.ok) {
        console.error("Failed to fetch team data:", teamResponse.status, teamResponse.statusText);
        return;
      }

      const { team } = await teamResponse.json();
      console.log("Team data fetched:", team);
      if (!team || !team.players?.main) {
        console.error("Team data not found or invalid structure");
        return;
      }

      // Find the indices of the players to swap
      const player1Index = team.players.main.findIndex((p: { _id: string }) => p._id === player1Id);
      const player2Index = team.players.main.findIndex((p: { _id: string }) => p._id === player2Id);

      console.log("Player indices:", { player1Index, player2Index });

      if (player1Index === -1 || player2Index === -1) {
        console.error("One or both players not found in team:", { player1Id, player2Id });
        return;
      }

      // Create new players array with swapped positions
      const newPlayers = [...team.players.main];
      [newPlayers[player1Index], newPlayers[player2Index]] = [newPlayers[player2Index], newPlayers[player1Index]];

      console.log("Swapping players:", {
        before: [team.players.main[player1Index], team.players.main[player2Index]],
        after: [newPlayers[player1Index], newPlayers[player2Index]]
      });

      // Update team with new player order
      const updateResponse = await fetch(`/api/v1/teams/${teamId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          players: {
            main: newPlayers,
            substitutes: team.players.substitutes || []
          }
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Failed to update team player order:", updateResponse.status, errorText);
        return;
      }

      console.log("Team updated successfully");
    } catch (_error) {}
  };


  // Player slot component
  const PlayerSlot = ({
    player,
    teamId,
    side,
    gameNumber,
    currentChampion,
    onChampionChange,
    isDisabled = false,
    editingGame
  }: {
    player: { _id: string; inGameName?: string; tag: string; role?: PlayerRole };
    teamId: string;
    side: "blue" | "red";
    gameNumber?: number;
    currentChampion?: number;
    onChampionChange?: (gameNumber: number, side: "blue" | "red", playerId: string, championId: number) => void;
    isDisabled?: boolean;
    editingGame?: number | null;
  }) => {
    // Get current position in the game order
    const key = `${gameNumber}:${teamId}`;
    const currentOrder = gameOrder[key] || [];
    const currentPosition = currentOrder.findIndex(p => p._id === player._id);
    const positionNames = ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"];
    const currentPositionName = currentPosition >= 0 ? positionNames[currentPosition] : "UNKNOWN";

    return (
      <div className="p-3 rounded-md bg-gray-700/50 hover:bg-gray-700/70 transition-colors">
        {/* Player name */}
        <div className="mb-3">
          <span className="text-xl font-medium text-white">{player.inGameName || player.tag}</span>
        </div>
        
        {/* Inputs in same column */}
        <div className="space-y-2">
          {/* Champion select */}
          <select
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            id={`champion-select-${gameNumber ?? "pending"}-${side}-${player._id}`}
            name={`champion-select-${gameNumber ?? "pending"}-${side}-${player._id}`}
            value={currentChampion ?? ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              if (onChampionChange && gameNumber) {
                onChampionChange(gameNumber, side, player._id, parseInt(e.target.value));
              }
            }}
            disabled={isDisabled}
          >
            <option value="">Select champion</option>
            {champions.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          
          {/* Position and swap dropdown */}
          {editingGame === gameNumber && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 min-w-[60px]">{currentPositionName}</span>
              <select
                className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                value=""
                onChange={(e) => {
                  const targetPlayerId = e.target.value;
                  if (targetPlayerId && targetPlayerId !== player._id && gameNumber) {
                    handlePositionSwap(teamId, gameNumber, player._id, targetPlayerId);
                  }
                }}
                disabled={isDisabled}
              >
                <option value="">swap with</option>
                {currentOrder
                  .filter(p => p._id !== player._id)
                  .map(targetPlayer => (
                    <option key={targetPlayer._id} value={targetPlayer._id}>
                      {targetPlayer.inGameName || targetPlayer.tag}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  const requiredWins = Math.ceil(maxGames / 2);
  const seriesDecided = teamWins.team1Wins >= requiredWins || teamWins.team2Wins >= requiredWins;
  const displayCount = seriesDecided ? existing.length : Math.min(maxGames, Math.max(minGames, existing.length + 1));
  const slots = Array.from({ length: displayCount }, (_, i) => i + 1);
  const firstPending = slots.find((num) => !existing.find((g) => g.gameNumber === num));

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
            onClick={async () => {
              await onAddGame();
              setEditingGame(existing.length + 1);
            }}
            size="sm"
            variant="primary"
            disabled={
              teamWins.team1Wins >= Math.ceil(getMaxGamesByFormat(match.format) / 2) ||
              teamWins.team2Wins >= Math.ceil(getMaxGamesByFormat(match.format) / 2) ||
              teamWins.team1Wins + teamWins.team2Wins >= getMaxGamesByFormat(match.format) ||
              saving
            }
          >
            Add Series Game
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {slots.map((num) => {
          const game = existing.find((g) => g.gameNumber === num);
          if (!game) {
            if (editing && firstPending === num && editingGame === num) {
              return (
                <div key={`editor_${num}`} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-300">Game {num}</span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-blue-100">Editing</span>
                    </div>
                    <button
                      onClick={() => setEditingGame(null)}
                      className="px-3 py-1 rounded text-xs font-medium bg-red-600 text-red-100 hover:bg-red-500 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-3 items-center gap-2">
                      <div className="text-gray-400 text-xs text-left">Blue Side</div>
                      <div />
                      <div className="text-gray-400 text-xs text-right">Red Side</div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <div className="text-white text-sm truncate text-left">
                        {teamsSwapped ? redTeam?.name : blueTeam?.name}
                      </div>
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={onSwapTeams}
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white border border-gray-500"
                          aria-label="Swap teams"
                          title="Swap teams"
                        >
                          ⇄
                        </button>
                      </div>
                      <div className="text-white text-sm truncate text-right">
                        {teamsSwapped ? blueTeam?.name : redTeam?.name}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                      <div className="flex items-center justify-start">
                        <input
                          type="checkbox"
                          onChange={async () => {
                            await onAddGame("blue");
                            setEditingGame(num);
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
                            setEditingGame(num);
                          }}
                          className="h-4 w-4"
                        />
                      </div>
                    </div>

                    {/* Players section for pending game */}
                    <div className="mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-2">Blue side champions</div>
                          <div className="space-y-2">
                            {(() => {
                              const key = `${num}:${teamsSwapped ? match.redTeamId : match.blueTeamId}`;
                              const list = gameOrder[key] || [];
                              return list
                                .slice(0, 5)
                                .map((p) => (
                                  <PlayerSlot
                                    key={`blue_pending_${p._id}`}
                                    player={p}
                                    teamId={teamsSwapped ? match.redTeamId : match.blueTeamId}
                                    side="blue"
                                    isDisabled={false}
                                    gameNumber={num}
                                  />
                                ));
                            })()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 text-right">Red side champions</div>
                          <div className="space-y-2">
                            {(() => {
                              const key = `${num}:${teamsSwapped ? match.blueTeamId : match.redTeamId}`;
                              const list = gameOrder[key] || [];
                              return list
                                .slice(0, 5)
                                .map((p) => (
                                  <PlayerSlot
                                    key={`red_pending_${p._id}`}
                                    player={p}
                                    teamId={teamsSwapped ? match.blueTeamId : match.redTeamId}
                                    side="red"
                                    isDisabled={false}
                                    gameNumber={num}
                                  />
                                ));
                            })()}
                          </div>
                        </div>
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
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-300">
                    {game.blueScore} - {game.redScore}
                  </div>
                  <button
                    onClick={() => {
                      const newEditingGame = editingGame === game.gameNumber ? null : game.gameNumber;
                      setEditingGame(newEditingGame);
                      
                      // Ensure gameOrder is initialized for this game when starting to edit
                      if (newEditingGame !== null) {
                        const blueTeamId = getTeamIdForSide(game, "blue");
                        const redTeamId = getTeamIdForSide(game, "red");
                        const blueKey = `${game.gameNumber}:${blueTeamId}`;
                        const redKey = `${game.gameNumber}:${redTeamId}`;
                        
                        setGameOrder((prev) => {
                          const newOrder = { ...prev };
                          
                          // Initialize blue side if not exists
                          if (!newOrder[blueKey] && blueTeam?.players?.main) {
                            newOrder[blueKey] = blueTeam.players.main.slice(0, 5);
                          }
                          
                          // Initialize red side if not exists
                          if (!newOrder[redKey] && redTeam?.players?.main) {
                            newOrder[redKey] = redTeam.players.main.slice(0, 5);
                          }
                          
                          return newOrder;
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      editingGame === game.gameNumber
                        ? "bg-green-600 text-green-100"
                        : "bg-blue-600 text-blue-100 hover:bg-blue-500"
                    }`}
                  >
                    {editingGame === game.gameNumber ? "Editing" : "Edit"}
                  </button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 items-center">
                <div className="text-white text-sm truncate text-left">
                  {(() => {
                    const blueTeamName = typeof game.blueTeam === "string" ? game.blueTeam : game.blueTeam?.teamName;
                    
                    // If game team data is empty, use match team data as fallback
                    if (!blueTeamName || blueTeamName === '') {
                      const blueTeamId = getTeamIdForSide(game, "blue");
                      return blueTeamId === match.blueTeamId ? blueTeam?.name : redTeam?.name;
                    }
                    
                    return blueTeamName;
                  })()}
                </div>
                <div className="text-center text-gray-400 text-xs">VS</div>
                <div className="text-white text-sm truncate text-right">
                  {(() => {
                    const redTeamName = typeof game.redTeam === "string" ? game.redTeam : game.redTeam?.teamName;
                    
                    // If game team data is empty, use match team data as fallback
                    if (!redTeamName || redTeamName === '') {
                      const redTeamId = getTeamIdForSide(game, "red");
                      return redTeamId === match.blueTeamId ? blueTeam?.name : redTeam?.name;
                    }
                    
                    return redTeamName;
                  })()}
                </div>
              </div>
              {editingGame === game.gameNumber && (
                <div className="mt-3 grid grid-cols-3 items-center gap-2">
                  <div className="text-gray-400 text-xs text-left">Blue Side</div>
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleSideSwapWithPlayerOrder(num)}
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
              {editingGame === game.gameNumber && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-2">Blue side champions</div>
                      <div className="space-y-2">
                        {(() => {
                          // Use team ID key for blue side
                          const blueSideTeamId = getTeamIdForSide(game, "blue");
                          const blueKey = `${game.gameNumber}:${blueSideTeamId}`;
                          const blueSideList = gameOrder[blueKey] || [];
                          
                          
                          return (blueSideList || []).slice(0, 5).map((p) => {
                            const current = game.championsPlayed?.[blueSideTeamId]?.[p._id];
                            return (
                              <PlayerSlot
                                key={`blue_${game.gameNumber}_${p._id}`}
                                player={p}
                                teamId={blueSideTeamId}
                                side="blue"
                                gameNumber={game.gameNumber}
                                currentChampion={current}
                                onChampionChange={onChampionPlayedChange}
                                editingGame={editingGame}
                              />
                            );
                          });
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-2 text-right">Red side champions</div>
                      <div className="space-y-2">
                        {(() => {
                          // Use team ID key for red side
                          const redSideTeamId = getTeamIdForSide(game, "red");
                          const redKey = `${game.gameNumber}:${redSideTeamId}`;
                          const redSideList = gameOrder[redKey] || [];
                          
                          
                          return (redSideList || []).slice(0, 5).map((p) => {
                            const current = game.championsPlayed?.[redSideTeamId]?.[p._id];
                            return (
                              <PlayerSlot
                                key={`red_${game.gameNumber}_${p._id}`}
                                player={p}
                                teamId={redSideTeamId}
                                side="red"
                                gameNumber={game.gameNumber}
                                currentChampion={current}
                                onChampionChange={onChampionPlayedChange}
                                editingGame={editingGame}
                              />
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {editing && num > getMinGamesByFormat(match.format) && (
                <div className="mt-3 flex justify-end">
                  <Button onClick={() => onDeleteGame(num)} size="sm" variant="destructive" className="text-xs">
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
