"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@lib/layout";
import { LoadingSpinner, Button } from "@lib/components/common";
import type { Match, GameResult, MatchStatus, MatchFormat } from "@lib/types/match";
import type { Tournament } from "@lib/types/tournament";
import type { PlayerStatsDoc } from "@lib/database/models";

interface MatchDetailPageProps {
  params: Promise<{
    tournamentId: string;
    matchId: string;
  }>;
}

export default function MatchDetailPage({ params }: MatchDetailPageProps): React.ReactElement {
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStatsDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editData, setEditData] = useState<Partial<Match>>({});
  const [newGame, setNewGame] = useState<Partial<GameResult>>({
    gameNumber: 1,
    winner: "blue",
    blueScore: 0,
    redScore: 0,
    blueTeam: "",
    redTeam: ""
  });

  const hasFetchedData = useRef(false);

  useEffect(() => {
    console.log("🚀 useEffect triggered");
    let isMounted = true;

    const resolveParams = async () => {
      try {
        console.log("🔍 Resolving params...");
        const resolvedParams = await params;
        console.log("🔍 Params resolved:", resolvedParams);
        if (isMounted && !hasFetchedData.current) {
          console.log("🔍 Calling fetchMatchData...");
          await fetchMatchData(resolvedParams.tournamentId, resolvedParams.matchId);
        } else {
          console.log("🔍 Skipping fetch - mounted:", isMounted, "hasFetched:", hasFetchedData.current);
        }
      } catch (error) {
        if (isMounted) {
          console.error("❌ Error resolving params:", error);
        }
      }
    };

    resolveParams();

    return () => {
      console.log("🧹 Cleanup - setting isMounted to false");
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const fetchMatchData = async (tournamentId: string, matchId: string) => {
    console.log("🔍 fetchMatchData called with:", { tournamentId, matchId });

    try {
      console.log("📡 Starting API calls...");

      // Fetch match data
      console.log("📡 Fetching match data...");
      const matchResponse = await fetch(`/api/v1/matches/${matchId}`);
      console.log("📡 Match response status:", matchResponse.status);
      if (!matchResponse.ok) throw new Error("Failed to fetch match");
      const matchData = await matchResponse.json();
      console.log("📡 Match data received:", matchData);

      // Ensure we have valid match data
      if (!matchData.match) {
        throw new Error("Invalid match data received");
      }

      const matchWithDefaults = {
        ...matchData.match,
        games: matchData.match.games || [],
        commentators: matchData.match.commentators || [],
        predictions: matchData.match.predictions || []
      };
      console.log("📡 Setting match state:", matchWithDefaults);
      setMatch(matchWithDefaults);
      setEditData(matchWithDefaults);

      // Fetch tournament data
      console.log("📡 Fetching tournament data...");
      const tournamentResponse = await fetch(`/api/v1/tournaments/${tournamentId}`);
      console.log("📡 Tournament response status:", tournamentResponse.status);
      if (!tournamentResponse.ok) throw new Error("Failed to fetch tournament");
      const tournamentData = await tournamentResponse.json();
      console.log("📡 Tournament data received:", tournamentData);

      // Ensure we have valid tournament data
      if (!tournamentData.tournament) {
        throw new Error("Invalid tournament data received");
      }

      console.log("📡 Setting tournament state:", tournamentData.tournament);
      setTournament(tournamentData.tournament);

      // Fetch player stats for this match
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
      console.log("✅ Fetch completed, setting loading to false");
      setLoading(false);
      hasFetchedData.current = true;
      console.log("✅ Current state - match:", !!match, "tournament:", !!tournament, "loading:", false);
    }
  };

  const handleSave = async () => {
    if (!match) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/v1/matches/${match._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData)
      });

      if (!response.ok) throw new Error("Failed to update match");

      const updatedMatch = await response.json();
      setMatch(updatedMatch.match);
      setEditData(updatedMatch.match);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleAddGame = async () => {
    if (!match || !newGame.gameNumber) return;

    try {
      setSaving(true);
      const gameData = {
        ...newGame,
        _id: `game_${Date.now()}`,
        startTime: new Date(),
        completedAt: new Date()
      };

      const updatedGames = [...(match.games || []), gameData as GameResult];
      const response = await fetch(`/api/v1/matches/${match._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ games: updatedGames })
      });

      if (!response.ok) throw new Error("Failed to add game");

      const updatedMatch = await response.json();
      setMatch(updatedMatch.match);
      setEditData(updatedMatch.match);
      setNewGame({ gameNumber: 1, winner: "blue", blueScore: 0, redScore: 0, blueTeam: "", redTeam: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add game");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: MatchStatus) => {
    if (!match) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/v1/matches/${match._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error("Failed to update status");

      const updatedMatch = await response.json();
      setMatch(updatedMatch.match);
      setEditData(updatedMatch.match);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-screen p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <LoadingSpinner />
            <div className="text-white mt-4">Loading match data...</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !match || !tournament) {
    return (
      <PageWrapper>
        <div className="min-h-screen p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">Error loading match</div>
            <p className="text-gray-500">{error || "Match not found"}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={match.name}
      subtitle={`${tournament.name} - Match Details`}
      breadcrumbs={[
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: tournament.name, href: `/modules/tournaments/${tournament._id}` },
        { label: "Matches", href: `/modules/tournaments/${tournament._id}/matches` },
        { label: match.name, href: `/modules/tournaments/${tournament._id}/matches/${match._id}`, isActive: true }
      ]}
    >
      <div className="min-h-screen p-6 max-w-7xl mx-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{match.name}</h1>
            <p className="text-gray-400 mt-2">
              {tournament.name} • {match.format} • {match.status}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {editing ? (
              <>
                <Button onClick={handleSave} disabled={saving} variant="primary">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button onClick={() => setEditing(false)} variant="secondary">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} variant="primary">
                Edit Match
              </Button>
            )}
            <Button onClick={() => router.back()} variant="secondary">
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Match Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match Details Card */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Match Information</h3>

              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Match Name</label>
                      <input
                        type="text"
                        value={editData.name || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                        placeholder="Match name"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
                      <select
                        value={editData.format || match.format}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setEditData({ ...editData, format: e.target.value as MatchFormat })
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="BO1">Best of 1</option>
                        <option value="BO3">Best of 3</option>
                        <option value="BO5">Best of 5</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Scheduled Time</label>
                      <input
                        type="datetime-local"
                        value={
                          editData.scheduledTime ? new Date(editData.scheduledTime).toISOString().slice(0, 16) : ""
                        }
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditData({ ...editData, scheduledTime: new Date(e.target.value) })
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                      <select
                        value={editData.status || match.status}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setEditData({ ...editData, status: e.target.value as MatchStatus })
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white ml-2">{match.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Format:</span>
                    <span className="text-white ml-2">{match.format}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white ml-2">{match.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Scheduled:</span>
                    <span className="text-white ml-2">
                      {match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : "TBD"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Games Results */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Game Results</h3>
                {editing && (
                  <Button onClick={handleAddGame} size="sm" variant="secondary">
                    Add Game
                  </Button>
                )}
              </div>

              {!match.games || match.games.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No games played yet</div>
              ) : (
                <div className="space-y-3">
                  {match.games.map((game, index) => (
                    <div key={game._id || index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-300">Game {game.gameNumber}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              game.winner === "blue" ? "bg-blue-600 text-blue-100" : "bg-red-600 text-red-100"
                            }`}
                          >
                            {game.winner === "blue" ? "Blue Win" : "Red Win"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300">
                          {game.blueScore} - {game.redScore}
                        </div>
                      </div>
                      {game.duration && (
                        <div className="text-xs text-gray-500 mt-2">
                          Duration: {Math.floor(game.duration / 60)}:{(game.duration % 60).toString().padStart(2, "0")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Game Form */}
              {editing && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-3">Add New Game</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Game #"
                      value={newGame.gameNumber || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewGame({ ...newGame, gameNumber: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={newGame.winner || "blue"}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setNewGame({ ...newGame, winner: e.target.value as "blue" | "red" })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="blue">Blue Win</option>
                      <option value="red">Red Win</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Blue Score"
                      value={newGame.blueScore || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewGame({ ...newGame, blueScore: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Red Score"
                      value={newGame.redScore || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewGame({ ...newGame, redScore: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Player Statistics */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Player Statistics</h3>

              {!playerStats || playerStats.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No player statistics available for this match</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left text-gray-300 p-2">Player</th>
                        <th className="text-left text-gray-300 p-2">Champion</th>
                        <th className="text-left text-gray-300 p-2">K/D/A</th>
                        <th className="text-left text-gray-300 p-2">CS/min</th>
                        <th className="text-left text-gray-300 p-2">Gold/min</th>
                        <th className="text-left text-gray-300 p-2">Damage</th>
                        <th className="text-left text-gray-300 p-2">Vision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerStats.map((stat) => (
                        <tr
                          key={`${stat.playerId}-${stat.gameId}-${stat.championId}`}
                          className="border-b border-gray-700"
                        >
                          <td className="text-white p-2">{stat.playerId}</td>
                          <td className="text-gray-300 p-2">{stat.championName}</td>
                          <td className="text-gray-300 p-2">
                            {stat.stats?.kda
                              ? `${stat.stats.kda.kills}/${stat.stats.kda.deaths}/${stat.stats.kda.assists}`
                              : "0/0/0"}
                          </td>
                          <td className="text-gray-300 p-2">{stat.stats?.csPerMinute?.toFixed(1) || "0.0"}</td>
                          <td className="text-gray-300 p-2">{stat.stats?.goldPerMinute?.toFixed(0) || "0"}</td>
                          <td className="text-gray-300 p-2">{stat.stats?.damageDealt?.toLocaleString() || "0"}</td>
                          <td className="text-gray-300 p-2">{stat.stats?.visionScore || "0"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => handleStatusChange("in-progress")}
                  disabled={match.status === "in-progress" || saving}
                  variant="secondary"
                  className="w-full"
                >
                  Start Match
                </Button>
                <Button
                  onClick={() => handleStatusChange("completed")}
                  disabled={match.status === "completed" || saving}
                  variant="secondary"
                  className="w-full"
                >
                  Complete Match
                </Button>
                <Button
                  onClick={() => router.push(`/modules/leagueclient/champselect?matchId=${match._id}`)}
                  variant="secondary"
                  className="w-full"
                >
                  Open Champ Select
                </Button>
              </div>
            </div>

            {/* Match Info */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Match Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Match ID:</span>
                  <span className="text-white font-mono">{match._id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">{match.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Patch:</span>
                  <span className="text-white">{match.patchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fearless Draft:</span>
                  <span className="text-white">{match.isFearlessDraft ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">{new Date(match.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Teams */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Teams</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-lg font-medium text-blue-400">Blue Team</div>
                  <div className="text-sm text-gray-300">{match.blueTeamId}</div>
                </div>
                <div className="text-center text-2xl font-bold text-gray-400">VS</div>
                <div className="text-center">
                  <div className="text-lg font-medium text-red-400">Red Team</div>
                  <div className="text-sm text-gray-300">{match.redTeamId}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
