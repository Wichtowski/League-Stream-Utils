import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@lib/components/common";
import type { Match, GameResult, MatchFormat } from "@libTournament/types/matches";
import type { Team } from "@libTeam/types";
import type { Champion } from "@lib/types/game";

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
  teamWins
}) => {
  const [draggedPlayer, setDraggedPlayer] = useState<{playerId: string, teamId: string, side: "blue" | "red"} | null>(null);
  const [dragOverPlayer, setDragOverPlayer] = useState<string | null>(null);
  const maxGames = getMaxGamesByFormat(match.format);
  const minGames = getMinGamesByFormat(match.format);
  const existing = match.games || [];

  // Framer Motion drag handlers
  const handleDragStart = (playerId: string, teamId: string, side: "blue" | "red") => {
    console.log('handleDragStart called with:', { playerId, teamId, side });
    setDraggedPlayer({ playerId, teamId, side });
    console.log('setDraggedPlayer called');
  };

  const _handleDragEnd = () => {
    setDraggedPlayer(null);
    setDragOverPlayer(null);
  };


  const handleDrop = async (targetPlayerId: string, targetTeamId: string) => {
    console.log('handleDrop called with:', { targetPlayerId, targetTeamId, draggedPlayer });
    if (draggedPlayer && draggedPlayer.playerId !== targetPlayerId && draggedPlayer.teamId === targetTeamId) {
      console.log('Attempting to swap players:', draggedPlayer.playerId, targetPlayerId, targetTeamId);
      await swapPlayersInTeam(draggedPlayer.playerId, targetPlayerId, targetTeamId);
    } else {
      console.log('Drop conditions not met:', { 
        hasDraggedPlayer: !!draggedPlayer, 
        differentPlayers: draggedPlayer?.playerId !== targetPlayerId,
        sameTeam: draggedPlayer?.teamId === targetTeamId 
      });
    }
    
    // Don't clear state here - it's already cleared in onDragEnd
  };

  const swapPlayersInTeam = async (player1Id: string, player2Id: string, teamId: string) => {
    console.log('swapPlayersInTeam called with:', { player1Id, player2Id, teamId });
    
    // Prevent swapping the same player
    if (player1Id === player2Id) {
      console.log('Cannot swap player with themselves');
      return;
    }
    
    try {
      // Get current team data
      const teamResponse = await fetch(`/api/v1/teams/${teamId}`);
      if (!teamResponse.ok) {
        console.error('Failed to fetch team data:', teamResponse.status, teamResponse.statusText);
        return;
      }
      
      const { team } = await teamResponse.json();
      console.log('Team data fetched:', team);
      if (!team || !team.players?.main) {
        console.error('Team data not found or invalid structure');
        return;
      }

      // Find the indices of the players to swap
      const player1Index = team.players.main.findIndex((p: { _id: string }) => p._id === player1Id);
      const player2Index = team.players.main.findIndex((p: { _id: string }) => p._id === player2Id);
      
      console.log('Player indices:', { player1Index, player2Index });
      
      if (player1Index === -1 || player2Index === -1) {
        console.error('One or both players not found in team:', { player1Id, player2Id });
        return;
      }

      // Create new players array with swapped positions
      const newPlayers = [...team.players.main];
      [newPlayers[player1Index], newPlayers[player2Index]] = [newPlayers[player2Index], newPlayers[player1Index]];

      console.log('Swapping players:', {
        before: [team.players.main[player1Index], team.players.main[player2Index]],
        after: [newPlayers[player1Index], newPlayers[player2Index]]
      });

      // Update team with new player order
      const updateResponse = await fetch(`/api/v1/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
        console.error('Failed to update team player order:', updateResponse.status, errorText);
        return;
      }

      console.log('Team updated successfully, reloading page...');
      // Refresh the page to show updated player order
      window.location.reload();
      
    } catch (error) {
      console.error('Error swapping players:', error);
    }
  };

  // Draggable player component
  const DraggablePlayer = ({ 
    player, 
    teamId, 
    side, 
    gameNumber, 
    currentChampion, 
    onChampionChange, 
    isDisabled = false 
  }: {
    player: { _id: string; inGameName?: string; tag: string };
    teamId: string;
    side: "blue" | "red";
    gameNumber?: number;
    currentChampion?: number;
    onChampionChange?: (gameNumber: number, side: "blue" | "red", playerId: string, championId: number) => void;
    isDisabled?: boolean;
  }) => {
    const isDragging = draggedPlayer?.playerId === player._id;
    const isDragOver = dragOverPlayer === player._id;
    const canDrop = draggedPlayer && draggedPlayer.teamId === teamId && draggedPlayer.playerId !== player._id;
    const isBeingDraggedOver = draggedPlayer && draggedPlayer.playerId !== player._id && draggedPlayer.teamId === teamId;
    
    console.log('DraggablePlayer render:', { 
      playerId: player._id, 
      editing, 
      isDisabled, 
      dragEnabled: editing && !isDisabled,
      isDragging 
    });
    
    return (
      <motion.div
        drag={editing && !isDisabled}
        style={{ touchAction: 'none' }}
        dragConstraints={false}
        dragElastic={0}
        dragMomentum={false}
        dragSnapToOrigin={false}
        dragPropagation={false}
        dragTransition={{ bounceStiffness: 0, bounceDamping: 0 }}
        onDragStart={() => {
          console.log('Drag started for player:', player._id);
          handleDragStart(player._id, teamId, side);
          // Add visual indicators to all valid drop targets
          const elements = document.querySelectorAll('[data-player-id]');
          elements.forEach((el) => {
            const targetPlayerId = el.getAttribute('data-player-id');
            const targetTeamId = el.getAttribute('data-team-id');
            if (targetPlayerId && targetTeamId && targetPlayerId !== player._id && targetTeamId === teamId) {
              el.classList.add('border-2', 'border-blue-500', 'animate-pulse', 'bg-blue-900/20');
            }
          });
        }}
        onDrag={(_event, _info) => {
          // Prevent snap-back by maintaining the drag position
          // console.log('Dragging:', info.point.x, info.point.y, 'draggedPlayer:', draggedPlayer?.playerId);
        }}
        onDragEnd={(_, info) => {
          console.log('Drag end triggered');
          // Remove visual indicators first
          const elements = document.querySelectorAll('[data-player-id]');
          elements.forEach((el) => {
            el.classList.remove('border-2', 'border-blue-500', 'animate-pulse', 'bg-blue-900/20');
          });
          
          // Use a more reliable method to find drop targets
          let closestElement = null;
          let closestDistance = Infinity;
          
          elements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.sqrt(
              Math.pow(info.point.x - centerX, 2) + Math.pow(info.point.y - centerY, 2)
            );
            
            if (distance < closestDistance && distance < 100) { // Within 100px
              closestDistance = distance;
              closestElement = el;
            }
          });
          
          if (closestElement) {
            const targetPlayerId = (closestElement as HTMLElement).getAttribute('data-player-id');
            const targetTeamId = (closestElement as HTMLElement).getAttribute('data-team-id');
            console.log('Drop target found:', { targetPlayerId, targetTeamId, draggedPlayer: draggedPlayer?.playerId });
            if (targetPlayerId && targetTeamId && targetPlayerId !== player._id) {
              console.log('Attempting drop');
              handleDrop(targetPlayerId, targetTeamId);
            }
          }
          
          // Always clear the drag state when drag ends
          setDraggedPlayer(null);
          setDragOverPlayer(null);
        }}
        whileDrag={{ 
          scale: 1.05, 
          rotate: 2,
          zIndex: 1000,
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          opacity: 0.7
        }}
        className={`
          flex items-center justify-between gap-2 p-2 rounded-md cursor-grab
          ${isDragOver && canDrop ? 'bg-green-900/50 border-2 border-green-500' : ''}
          ${isDragOver && !canDrop ? 'bg-red-900/50 border-2 border-red-500' : ''}
          ${isBeingDraggedOver ? 'border-2 border-blue-500 bg-blue-900/20' : ''}
          ${editing && !isDisabled && !isDragging ? 'hover:bg-gray-700/50' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        data-player-id={player._id}
        data-team-id={teamId}
      >
        <div className="flex items-center gap-2">
          {editing && !isDisabled && (
            <div className="text-gray-400 text-xs cursor-grab hover:text-gray-200 select-none">⋮⋮</div>
          )}
          <span className="text-sm text-gray-300 truncate">{player.inGameName || player.tag}</span>
          <AnimatePresence>
            {isDragOver && canDrop && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-green-400 text-xs font-bold"
              >
                ✓ Drop here
              </motion.div>
            )}
            {isDragOver && !canDrop && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-red-400 text-xs font-bold"
              >
                ✗ Invalid drop
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <select
          className="w-40 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
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
      </motion.div>
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
            onClick={() => onAddGame()}
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
                    
                    {/* Players section for pending game */}
                    <div className="mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-2">Blue side champions</div>
                          <div className="space-y-2">
                            {((teamsSwapped ? redTeam?.players?.main : blueTeam?.players?.main) || []).slice(0, 5).map((p) => (
                              <DraggablePlayer
                                key={`blue_pending_${p._id}`}
                                player={p}
                                teamId={teamsSwapped ? match.redTeamId : match.blueTeamId}
                                side="blue"
                                isDisabled={false}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 text-right">Red side champions</div>
                          <div className="space-y-2">
                            {((teamsSwapped ? blueTeam?.players?.main : redTeam?.players?.main) || []).slice(0, 5).map((p) => (
                              <DraggablePlayer
                                key={`red_pending_${p._id}`}
                                player={p}
                                teamId={teamsSwapped ? match.blueTeamId : match.redTeamId}
                                side="red"
                                isDisabled={false}
                              />
                            ))}
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
                <div className="text-sm text-gray-300">
                  {game.blueScore} - {game.redScore}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 items-center">
                <div className="text-white text-sm truncate text-left">
                  {typeof game.blueTeam === 'string' ? game.blueTeam : game.blueTeam.teamName}
                </div>
                <div className="text-center text-gray-400 text-xs">VS</div>
                <div className="text-white text-sm truncate text-right">
                  {typeof game.redTeam === 'string' ? game.redTeam : game.redTeam.teamName}
                </div>
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
                        {(() => {
                          // For existing games, determine which team is on blue side based on game data
                          const blueSideTeamId = getTeamIdForSide(game, "blue");
                          const blueSideTeam = blueSideTeamId === match.blueTeamId ? blueTeam : redTeam;
                          return (blueSideTeam?.players?.main || []).slice(0, 5).map((p) => {
                            const current = game.championsPlayed?.[blueSideTeamId]?.[p._id];
                            return (
                              <DraggablePlayer
                                key={`blue_${game.gameNumber}_${p._id}`}
                                player={p}
                                teamId={blueSideTeamId}
                                side="blue"
                                gameNumber={game.gameNumber}
                                currentChampion={current}
                                onChampionChange={onChampionPlayedChange}
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
                          // For existing games, determine which team is on red side based on game data
                          const redSideTeamId = getTeamIdForSide(game, "red");
                          const redSideTeam = redSideTeamId === match.blueTeamId ? blueTeam : redTeam;
                          return (redSideTeam?.players?.main || []).slice(0, 5).map((p) => {
                            const current = game.championsPlayed?.[redSideTeamId]?.[p._id];
                            return (
                              <DraggablePlayer
                                key={`red_${game.gameNumber}_${p._id}`}
                                player={p}
                                teamId={redSideTeamId}
                                side="red"
                                gameNumber={game.gameNumber}
                                currentChampion={current}
                                onChampionChange={onChampionPlayedChange}
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
