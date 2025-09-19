"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@lib/layout";
import { LoadingSpinner, Button } from "@lib/components/common";
import { getChampions } from "@lib/champions";
import { getTeamWins } from "@libLeagueClient/utils/teamWins";
import type { Champion } from "@lib/types/game";
import type { Match, GameResult, MatchStatus, MatchFormat } from "@lib/types/match";
import type { Tournament } from "@lib/types/tournament";
import type { PlayerStatsDoc } from "@lib/database/models";
import { Team } from "@lib/types/team";

interface MatchDetailPageProps {
  params: Promise<{
    tournamentId: string;
    matchID: string;
    matchId?: string;
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
  const [blueTeam, setBlueTeam] = useState<Team | null>(null);
  const [redTeam, setRedTeam] = useState<Team | null>(null);

  const [editData, setEditData] = useState<Partial<Match>>({});
  const [newGame, setNewGame] = useState<Partial<GameResult>>({
    gameNumber: 1,
    winner: undefined,
    blueScore: 0,
    redScore: 0,
    blueTeam: "",
    redTeam: ""
  });
  const [teamsSwapped, setTeamsSwapped] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const preEditSnapshotRef = useRef<Match | null>(null);
  const [champions, setChampions] = useState<Champion[]>([]);

  type NormalizedStats = NonNullable<PlayerStatsDoc["stats"]>;

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
    setPlayerStats((prev) =>
      prev.map((row) =>
        row.playerId === target.playerId && row.gameId === target.gameId && row.championId === target.championId
          ? { ...row, stats: apply(normalizeStats(row)) }
          : row
      )
    );
  };

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

  const hasFetchedData = useRef(false);

  useEffect(() => {
    let mounted = true;
    getChampions().then((list) => {
      if (mounted) setChampions(list);
    }).catch(() => setChampions([]));
    return () => { mounted = false; };
  }, []);

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
    championId: number
  ): void => {
    if (!match) return;
    const games = (editData.games || match.games || []).map((g) => {
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
    setMatch({ ...match, games });
    setEditData({ ...editData, games });
  };

  useEffect(() => {
    if (match?.blueTeamId) {
      fetch(`/api/v1/teams/${match.blueTeamId}`)
        .then(res => res.json())
        .then(data => setBlueTeam(data.team))
        .catch(() => setBlueTeam(null));
    }
  }, [match?.blueTeamId]);

  useEffect(() => {
    if (match?.redTeamId) {
      fetch(`/api/v1/teams/${match.redTeamId}`)
        .then(res => res.json())
        .then(data => setRedTeam(data.team))
        .catch(() => setRedTeam(null));
    }
  }, [match?.redTeamId]);
  
  useEffect(() => {
    let isMounted = true;

    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        if (isMounted && !hasFetchedData.current) {
          const resolvedMatchId = resolvedParams.matchId ?? resolvedParams.matchID;
          await fetchMatchData(resolvedParams.tournamentId, resolvedMatchId);
        }
      } catch (_error) {
      }
    };

    resolveParams();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const fetchMatchData = async (tournamentId: string, matchId: string) => {
    try {
      const matchResponse = await fetch(`/api/v1/matches/${matchId}`);
      if (!matchResponse.ok) throw new Error("Failed to fetch match");
      const matchData = await matchResponse.json();

      if (!matchData.match) {
        throw new Error("Invalid match data received");
      }

      const matchWithDefaults = {
        ...matchData.match,
        games: matchData.match.games || [],
        commentators: matchData.match.commentators || [],
        predictions: matchData.match.predictions || []
      };
      setMatch(matchWithDefaults);
      setEditData(matchWithDefaults);

      const tournamentResponse = await fetch(`/api/v1/tournaments/${tournamentId}`);
      if (!tournamentResponse.ok) throw new Error("Failed to fetch tournament");
      const tournamentData = await tournamentResponse.json();

      // Ensure we have valid tournament data
      if (!tournamentData.tournament) {
        throw new Error("Invalid tournament data received");
      }

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
      setLoading(false);
      hasFetchedData.current = true;
    }
  };

  const handleSave = async () => {
    if (!match) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/v1/matches/${match._id}`, {
        method: "PUT",
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

  const handleAddGame = async (winnerOverride?: "blue" | "red") => {
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
        blueTeam: teamsSwapped ? (redTeam?.name || "") : (blueTeam?.name || ""),
        redTeam: teamsSwapped ? (blueTeam?.name || "") : (redTeam?.name || "")
      };

      const updatedGames = [...(match.games || []), gameData as GameResult];
      
      // Don't remove games when adding a new game - let the user complete their action
      const finalGames = updatedGames;
      
    const newScore = finalGames.reduce(
      (acc, g) => {
        if (g.winner === "blue") acc.blue += 1;
        if (g.winner === "red") acc.red += 1;
        return acc;
      },
      { blue: 0, red: 0 }
    );

    // Update local state without saving to database
    setMatch({
      ...match,
      games: finalGames,
      score: newScore,
      status: "ongoing"
    });
    setEditData({
      ...editData,
      games: finalGames,
      score: newScore,
      status: "ongoing"
    });
    
    const next = Math.min(currentGames + 2, getMaxGamesByFormat(match.format));
    setNewGame({ gameNumber: next, winner: undefined, blueScore: 0, redScore: 0, blueTeam: "", redTeam: "" });
  };

  const handleStatusChange = async (newStatus: MatchStatus) => {
    if (!match) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/v1/matches/${match._id}`, {
        method: "PUT",
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



  const handleUpdateGameWinner = (gameNumber: number, winner: "blue" | "red" | "ongoing") => {
    if (!match) return;
    
    const updatedGames: GameResult[] = (match.games || []).map((g) =>
      g.gameNumber === gameNumber
        ? {
            ...g,
            winner: winner,
            blueScore: winner === "blue" ? 1 : 0,
            redScore: winner === "red" ? 1 : 0
          }
        : { ...g, winner: (g.winner as "blue" | "red" | "ongoing") }
    );
    
    // Remove unnecessary games if series is now decided
    const finalGames = removeUnnecessaryGames(updatedGames);
    
    const newScore = finalGames.reduce(
      (acc, g) => {
        if (g.winner === "blue") acc.blue += 1;
        if (g.winner === "red") acc.red += 1;
        return acc;
      },
      { blue: 0, red: 0 }
    );

    // Update local state without saving to database
    setMatch({
      ...match,
      games: finalGames,
      score: newScore,
      status: "ongoing"
    });
    setEditData({
      ...editData,
      games: finalGames,
      score: newScore,
      status: "ongoing"
    });
  };

  const handleSwapGameSides = async (gameNumber: number) => {
    if (!match) return;
    
    const updatedGames: GameResult[] = (match.games || []).map((g) => {
      if (g.gameNumber !== gameNumber) return { ...g, winner: (g.winner as "blue" | "red" | "ongoing") };
      const newWinner = g.winner === "blue" ? "red" : "blue";
      return {
        ...g,
        winner: newWinner,
        blueScore: newWinner === "blue" ? 1 : 0,
        redScore: newWinner === "red" ? 1 : 0,
        blueTeam: g.redTeam,
        redTeam: g.blueTeam,
      } as GameResult;
    });
    
    // Remove unnecessary games if series is now decided
    const finalGames = removeUnnecessaryGames(updatedGames);
    
    const newScore = finalGames.reduce(
      (acc, g) => {
        if (g.winner === "blue") acc.blue += 1;
        if (g.winner === "red") acc.red += 1;
        return acc;
      },
      { blue: 0, red: 0 }
    );

    // Update local state without saving to database
    setMatch({
      ...match,
      games: finalGames,
      score: newScore,
      status: "ongoing"
    });
    setEditData({
      ...editData,
      games: finalGames,
      score: newScore,
      status: "ongoing"
    });
  };

  const handleSwapTeams = async () => {
    if (!match) return;
    
    const updated = {
      ...match,
      blueTeamId: match.redTeamId,
      redTeamId: match.blueTeamId
    } as Match;

    // Update local state without saving to database
    setMatch(updated);
    setEditData(updated);
  };

  const handleDeleteGame = (gameNumber: number) => {
    if (!match) return;
    
    const updatedGames = (match.games || []).filter(g => g.gameNumber !== gameNumber);
    const newScore = updatedGames.reduce(
      (acc, g) => {
        if (g.winner === "blue") acc.blue += 1;
        if (g.winner === "red") acc.red += 1;
        return acc;
      },
      { blue: 0, red: 0 }
    );

    // Update local state without saving to database
    setMatch({
      ...match,
      games: updatedGames,
      score: newScore,
      status: "ongoing"
    });
    setEditData({
      ...editData,
      games: updatedGames,
      score: newScore,
      status: "ongoing"
    });
  };

const [commentators, setCommentators] = useState<Array<{ id: string; name: string }>>([]);
const [predictions, setPredictions] = useState<Array<{ username: string; prediction: "blue" | "red"; submittedAt?: string }>>([]);
const [newCommentatorId, setNewCommentatorId] = useState("");
const [assigningCommentator, setAssigningCommentator] = useState(false);
const [submittingPrediction, setSubmittingPrediction] = useState<"blue" | "red" | null>(null);

useEffect(() => {
  const loadSideData = async () => {
    if (!match) return;
    try {
      const [comRes, predRes] = await Promise.all([
        fetch(`/api/v1/matches/${match._id}/commentators`),
        fetch(`/api/v1/matches/${match._id}/predictions`)
      ]);
      if (comRes.ok) {
        const data = await comRes.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCommentators((data.commentators || []).map((c: any) => ({ id: c.id || c._id, name: c.name })));
      }
      if (predRes.ok) {
        const data = await predRes.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPredictions((data.predictions || []).map((p: any) => ({ username: p.username || p.commentatorName, prediction: p.prediction, submittedAt: p.submittedAt || p.timestamp })));
      }
    } catch (_e) {
      // noop
    }
  };
  loadSideData();
}, [match?._id]);

const handleAssignCommentator = async () => {
  if (!match || !newCommentatorId) return;
  try {
    setAssigningCommentator(true);
    const res = await fetch(`/api/v1/matches/${match._id}/commentators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentatorId: newCommentatorId, matchId: match._id })
    });
    if (res.ok) {
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCommentators((data.commentators || []).map((c: any) => ({ id: c.id || c._id, name: c.name })));
      setNewCommentatorId("");
    }
  } finally {
    setAssigningCommentator(false);
  }
};

const submitPrediction = async (side: "blue" | "red") => {
  if (!match) return;
  try {
    setSubmittingPrediction(side);
    const res = await fetch(`/api/v1/matches/${match._id}/predictions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prediction: side })
    });
    if (res.ok) {
      const data = await res.json();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPredictions((data.predictions || []).map((p: any) => ({ username: p.username || p.commentatorName, prediction: p.prediction, submittedAt: p.submittedAt || p.timestamp })));
    }
  } finally {
    setSubmittingPrediction(null);
  }
};
  const handleDeleteMatch = async () => {
    if (!match) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/v1/matches/${match._id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete match");

      // Redirect back to tournament matches
      router.push(`/modules/tournaments/${match.tournamentId}/matches`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete match");
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const removeUnnecessaryGames = (games: GameResult[]) => {
    if (!match || games.length === 0) return games;

    const minGames = getMinGamesByFormat(match.format);
    const maxGames = getMaxGamesByFormat(match.format);

    const firstGame = games[0];
    const team1 = firstGame.blueTeam;

    const tally = games.reduce(
      (acc, g) => {
        if (g.winner === "blue") {
          if (g.blueTeam === team1) acc.team1 += 1; else acc.team2 += 1;
        } else if (g.winner === "red") {
          if (g.redTeam === team1) acc.team1 += 1; else acc.team2 += 1;
        }
        return acc;
      },
      { team1: 0, team2: 0 }
    );

    const requiredWins = Math.ceil(maxGames / 2);
    if (tally.team1 >= requiredWins || tally.team2 >= requiredWins) {
      return games.filter(g => g.gameNumber <= minGames);
    }

    return games;
  };

  // Memoized team wins calculation
  const teamWins = useMemo(() => {
    if (!match?.games || match.games.length === 0) return { team1Wins: 0, team2Wins: 0 };
    
    return getTeamWins(match.games);
  }, [match?.games]);

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
            <Button onClick={() => router.push(`/modules/tournaments/${tournament?._id}/matches`)} className="mt-4">
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
      actions={
        <>
          <span className="text-gray-400">LeagueClient</span>
          <Button target="_blank" href={`/modules/leagueclient/${tournament._id}/${match._id}/champselect`} size="sm" variant="primary">
            Open Champ Select
          </Button>
          <Button target="_blank" href={`/modules/leagueclient/${tournament._id}/${match._id}/game`} size="sm" variant="secondary">
            Open Game
          </Button>
        </>
      }
    >
      <div className="min-h-screen p-6 max-w-7xl mx-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{match.name}</h1>
            <p className="text-gray-400 mt-2">
              {match.format} • {match.status}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {editing ? (
              <>
                <Button onClick={handleSave} disabled={saving} variant="primary">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={() => {
                    if (preEditSnapshotRef.current) {
                      setMatch(preEditSnapshotRef.current);
                      setEditData(preEditSnapshotRef.current);
                    }
                    setEditing(false);
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button onClick={() => setShowDeleteModal(true)} disabled={saving} variant="destructive">
                  ✕ Delete Match
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    preEditSnapshotRef.current = match ? { ...match } : null;
                    setEditing(true);
                  }}
                  variant="primary"
                >
                  Edit Match
                </Button>
                <Button onClick={() => setShowDeleteModal(true)} disabled={saving} variant="destructive">
                  ✕ Delete Match
                </Button>
              </>
            )}
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
                        value={editData.name || match.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                        placeholder={match.name}
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
                  <Button
                    onClick={() => handleAddGame()}
                    size="sm"
                    variant="primary"
                    disabled={(
                      (teamWins.team1Wins >= Math.ceil(getMaxGamesByFormat(match.format) / 2)) ||
                      (teamWins.team2Wins >= Math.ceil(getMaxGamesByFormat(match.format) / 2)) ||
                      (teamWins.team1Wins + teamWins.team2Wins >= getMaxGamesByFormat(match.format)) || 
                      saving || !newGame.winner)}
                  >
                    Add Series Game
                  </Button>
                )}
              </div>

              {(() => {
                const maxGames = getMaxGamesByFormat(match.format);
                const minGames = getMinGamesByFormat(match.format);
                const existing = match.games || [];
                
                // Use teamWins to determine if series is decided
                const requiredWins = Math.ceil(maxGames / 2);
                const seriesDecided = teamWins.team1Wins >= requiredWins || teamWins.team2Wins >= requiredWins;
                // When series is decided, only show existing games (no new slots)
                // When series is ongoing, show existing games plus one more slot for the next game
                const displayCount = seriesDecided 
                  ? existing.length 
                  : Math.min(maxGames, Math.max(minGames, existing.length + 1));
                const slots = Array.from({ length: displayCount }, (_, i) => i + 1);
                const firstPending = slots.find(num => !existing.find(g => g.gameNumber === num));
                if (slots.length === 0) {
                  return <div className="text-center py-8 text-gray-400">No games played yet</div>;
                }
                return (
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
                                      onClick={() => setTeamsSwapped(!teamsSwapped)}
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
                                      checked={(teamsSwapped ? newGame.winner === "red" : newGame.winner === "blue") || false}
                                      onChange={async () => {
                                        const targetWinner = "blue" as const;
                                        const isCurrentlySelected = newGame.winner === targetWinner;
                                        if (!isCurrentlySelected) {
                                          // Add the game immediately when checkbox is checked
                                          await handleAddGame(targetWinner);
                                        }
                                      }}
                                      className="h-4 w-4"
                                    />
                                  </div>
                                  <div />
                                  <div className="flex items-center justify-end">
                                    <input
                                      type="checkbox"
                                      checked={(teamsSwapped ? newGame.winner === "blue" : newGame.winner === "red") || false}
                                      onChange={async () => {
                                        const targetWinner = "red" as const;
                                        const isCurrentlySelected = newGame.winner === targetWinner;
                                        if (!isCurrentlySelected) {
                                          await handleAddGame(targetWinner);
                                        }
                                      }}
                                      className="h-4 w-4"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center justify-end" />
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
                                  onClick={() => handleSwapGameSides(num)}
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
                                      // Unselect - set to ongoing
                                      handleUpdateGameWinner(num, "ongoing");
                                    } else {
                                      handleUpdateGameWinner(num, "blue");
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
                                      // Unselect - set to ongoing
                                      handleUpdateGameWinner(num, "ongoing");
                                    } else {
                                      handleUpdateGameWinner(num, "red");
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
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChampionPlayedChange(game.gameNumber, "blue", p._id, parseInt(e.target.value))}
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
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChampionPlayedChange(game.gameNumber, "red", p._id, parseInt(e.target.value))}
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
                                onClick={() => handleDeleteGame(num)}
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
                );
              })()}

              {/* Inline editor replaces the separate Add New Game form */}
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
                        {editing && <th className="text-right text-gray-300 p-2">Actions</th>}
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
                            {editing ? (
                              <div className="flex space-x-1">
                                <input
                                  type="number"
                                  className="w-14 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                                  value={stat.stats?.kda?.kills ?? 0}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const v = parseInt(e.target.value || "0");
                                    updatePlayerStat(stat, (ns) => ({ ...ns, kda: { kills: v, deaths: ns.kda?.deaths ?? 0, assists: ns.kda?.assists ?? 0 } }));
                                  }}
                                />
                                <input
                                  type="number"
                                  className="w-14 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                                  value={stat.stats?.kda?.deaths ?? 0}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const v = parseInt(e.target.value || "0");
                                    updatePlayerStat(stat, (ns) => ({ ...ns, kda: { kills: ns.kda?.kills ?? 0, deaths: v, assists: ns.kda?.assists ?? 0 } }));
                                  }}
                                />
                                <input
                                  type="number"
                                  className="w-14 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                                  value={stat.stats?.kda?.assists ?? 0}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const v = parseInt(e.target.value || "0");
                                    updatePlayerStat(stat, (ns) => ({ ...ns, kda: { kills: ns.kda?.kills ?? 0, deaths: ns.kda?.deaths ?? 0, assists: v } }));
                                  }}
                                />
                              </div>
                            ) : (
                              stat.stats?.kda
                              ? `${stat.stats.kda.kills}/${stat.stats.kda.deaths}/${stat.stats.kda.assists}`
                                : "0/0/0"
                            )}
                          </td>
                          <td className="text-gray-300 p-2">{editing ? (
                            <input
                              type="number"
                              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                              value={stat.stats?.csPerMinute ?? 0}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const v = parseFloat(e.target.value || "0");
                                updatePlayerStat(stat, (ns) => ({ ...ns, csPerMinute: v }));
                              }}
                            />
                          ) : (stat.stats?.csPerMinute?.toFixed(1) || "0.0")}</td>
                          <td className="text-gray-300 p-2">{editing ? (
                            <input
                              type="number"
                              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                              value={stat.stats?.goldPerMinute ?? 0}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const v = parseFloat(e.target.value || "0");
                                updatePlayerStat(stat, (ns) => ({ ...ns, goldPerMinute: v }));
                              }}
                            />
                          ) : (stat.stats?.goldPerMinute?.toFixed(0) || "0")}</td>
                          <td className="text-gray-300 p-2">{editing ? (
                            <input
                              type="number"
                              className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                              value={stat.stats?.damageDealt ?? 0}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const v = parseInt(e.target.value || "0");
                                updatePlayerStat(stat, (ns) => ({ ...ns, damageDealt: v }));
                              }}
                            />
                          ) : (stat.stats?.damageDealt?.toLocaleString() || "0")}</td>
                          <td className="text-gray-300 p-2">{editing ? (
                            <input
                              type="number"
                              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                              value={stat.stats?.visionScore ?? 0}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const v = parseInt(e.target.value || "0");
                                updatePlayerStat(stat, (ns) => ({ ...ns, visionScore: v }));
                              }}
                            />
                          ) : (stat.stats?.visionScore || "0")}</td>
                          {editing && (
                            <td className="text-right p-2" />
                          )}
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
              <h3 className="text-lg font-semibold text-white mb-4">Change Match Status</h3>
              <div className="space-y-3">
              {match.status !== "scheduled" && (
                <Button
                  onClick={() => handleStatusChange("scheduled")}
                  variant="secondary"
                  className="w-full"
                >
                  Schedule Match
                </Button>
              )}
              {match.status !== "in-progress" && (
                <Button
                  onClick={() => handleStatusChange("in-progress")}
                  variant="secondary"
                  className="w-full"
                >
                  Start Match
                </Button>
              )}
              {match.status !== "completed" && (
                <Button
                  onClick={() => handleStatusChange("completed")}
                  variant="secondary"
                  className="w-full"
                >
                  Complete Match
                </Button>
              )}
              {match.status !== "cancelled" && (
                <Button
                  onClick={() => handleStatusChange("cancelled")}
                  variant="secondary"
                  className="w-full"
                >
                  Cancel Match
                </Button>
              )}
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
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">{new Date(match.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Score:</span>
                  <span className="text-white font-mono">{teamWins.team1Wins} - {teamWins.team2Wins}</span>
                </div>
              </div>
            </div>

            {/* Teams */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex row items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Teams</h3>
                <Button onClick={handleSwapTeams} variant="secondary" size="sm" disabled={saving || !match}>
                  ⇄
                </Button>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-sm text-gray-300">{blueTeam?.name}</div>
                </div>
                <div className="text-center text-2xl font-bold text-gray-400">VS</div>
                <div className="text-center">
                  <div className="text-sm text-gray-300">{redTeam?.name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Commentators & Predictions */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Commentators</h3>
            <div className="space-y-3">
              {commentators.length === 0 ? (
                <div className="text-gray-400 text-sm">No commentators assigned</div>
              ) : (
                <ul className="space-y-2">
                  {commentators.map((c) => (
                    <li key={c.id} className="text-sm text-gray-200">{c.name}</li>
                  ))}
                </ul>
              )}
              {editing && (
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none"
                    placeholder="Commentator ID"
                    value={newCommentatorId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCommentatorId(e.target.value)}
                  />
                  <Button onClick={handleAssignCommentator} disabled={assigningCommentator || !newCommentatorId} size="sm" variant="secondary">
                    {assigningCommentator ? "Assigning..." : "Add"}
                  </Button>
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold text-white mt-6 mb-3">Predictions</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={() => submitPrediction("blue")} size="sm" disabled={submittingPrediction !== null} variant="secondary">
                  {submittingPrediction === "blue" ? "Submitting..." : "Predict Blue"}
                </Button>
                <Button onClick={() => submitPrediction("red")} size="sm" disabled={submittingPrediction !== null} variant="secondary">
                  {submittingPrediction === "red" ? "Submitting..." : "Predict Red"}
                </Button>
              </div>
              {predictions.length === 0 ? (
                <div className="text-gray-400 text-sm">No predictions yet</div>
              ) : (
                <ul className="space-y-2">
                  {predictions.map((p, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{p.username}</span>
                      <span className={`px-2 py-0.5 rounded ${p.prediction === "blue" ? "bg-blue-600 text-blue-100" : "bg-red-600 text-red-100"}`}>
                        {p.prediction.toUpperCase()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Match</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this match? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="secondary"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteMatch}
                variant="secondary"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={saving}
              >
                {saving ? "Deleting..." : "Delete Match"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
