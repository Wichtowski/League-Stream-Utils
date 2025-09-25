"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useModal } from "@lib/contexts/ModalContext";
import type { BracketStructure, BracketNode, UpdateMatchResultRequest, Tournament } from "@lib/types/championStats";

interface BracketManagerProps {
  tournament: Tournament;
  isOwner: boolean;
}

interface BracketData {
  bracket: BracketStructure;
  readyMatches: BracketNode[];
  completedMatches: BracketNode[];
  isComplete: boolean;
}

export const BracketManager = ({ tournament, isOwner }: BracketManagerProps): React.ReactElement => {
  const { showAlert, showConfirm } = useModal();
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<BracketNode | null>(null);
  const [showResultForm, setShowResultForm] = useState(false);

  const loadBracket = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/tournaments/${tournament._id}/bracket`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBracketData(data);
      } else if (response.status === 404) {
        setBracketData(null);
      }
    } catch (error) {
      console.error("Error loading bracket:", error);
    } finally {
      setLoading(false);
    }
  }, [tournament._id]);

  useEffect(() => {
    loadBracket();
  }, [loadBracket]);

  const generateBracket = useCallback(async () => {
    const confirmed = await showConfirm({
      message: "Generate tournament bracket? This will create matches based on current team registration.",
      confirmText: "Generate Bracket"
    });

    if (!confirmed) return;

    try {
      setGenerating(true);
      const response = await fetch(`/api/v1/tournaments/${tournament._id}/bracket`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBracketData(data);
        await showAlert({
          type: "success",
          message: "Bracket generated successfully!"
        });
      } else {
        const errorData = await response.json();
        await showAlert({
          type: "error",
          message: errorData.error || "Failed to generate bracket"
        });
      }
    } catch (error) {
      console.error("Error generating bracket:", error);
      await showAlert({
        type: "error",
        message: "Failed to generate bracket"
      });
    } finally {
      setGenerating(false);
    }
  }, [tournament._id, showAlert, showConfirm]);

  const updateMatchResult = useCallback(
    async (matchId: string, winner: string, score1: number, score2: number) => {
      try {
        const updateData: UpdateMatchResultRequest = {
          matchId,
          winner,
          score: {
            blue: score2,
            red: score1
          }
        };

        const response = await fetch(`/api/v1/tournaments/${tournament._id}/bracket`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          const data = await response.json();
          setBracketData(data);
          setShowResultForm(false);
          setSelectedMatch(null);

          await showAlert({
            type: "success",
            message: "Match result updated successfully!"
          });
        } else {
          const errorData = await response.json();
          await showAlert({
            type: "error",
            message: errorData.error || "Failed to update match result"
          });
        }
      } catch (error) {
        console.error("Error updating match result:", error);
        await showAlert({
          type: "error",
          message: "Failed to update match result"
        });
      }
    },
    [tournament._id, showAlert]
  );

  const resetBracket = useCallback(async () => {
    const confirmed = await showConfirm({
      message: "Delete the current bracket? This action cannot be undone.",
      confirmText: "Delete Bracket"
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/v1/tournaments/${tournament._id}/bracket`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        setBracketData(null);
        await showAlert({
          type: "success",
          message: "Bracket deleted successfully"
        });
      }
    } catch (error) {
      console.error("Error deleting bracket:", error);
      await showAlert({
        type: "error",
        message: "Failed to delete bracket"
      });
    }
  }, [tournament._id, showAlert, showConfirm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!bracketData) {
    return (
      <div className="text-center p-12">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">No Bracket Generated</h3>
          <p className="text-gray-400">Generate a tournament bracket to start managing matches.</p>
        </div>

        {isOwner && (
          <div className="space-y-4">
            <div className="bg-gray-800/40 rounded-lg p-4 max-w-md mx-auto">
              <h4 className="font-semibold text-white mb-2">Bracket Settings</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Format: Single Elimination</p>
                <p>Seeding: Manual</p>
                <p>Teams: {tournament.selectedTeams?.length || tournament.registeredTeams?.length || 0}</p>
              </div>
            </div>

            <button
              onClick={generateBracket}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
            >
              {generating ? "Generating..." : "Generate Bracket"}
            </button>
          </div>
        )}
      </div>
    );
  }

  const { bracket, readyMatches, completedMatches, isComplete } = bracketData;

  return (
    <div className="space-y-6">
      {/* Bracket Status */}
      <div className="bg-gray-800/40 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Tournament Bracket</h3>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span>
                Format: {bracket.format === "single-elimination" ? "Single Elimination" : "Double Elimination"}
              </span>
              <span>Teams: {bracket.metadata.teamsCount}</span>
              <span className={`px-2 py-1 rounded ${isComplete ? "bg-green-600" : "bg-yellow-600"}`}>
                {isComplete ? "Complete" : "In Progress"}
              </span>
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={resetBracket}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Reset Bracket
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-700/40 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">{readyMatches.length}</div>
            <div className="text-sm text-gray-400">Ready Matches</div>
          </div>
          <div className="bg-gray-700/40 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">{completedMatches.length}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="bg-gray-700/40 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-400">
              {bracket.nodes.length - completedMatches.length - readyMatches.length}
            </div>
            <div className="text-sm text-gray-400">Pending</div>
          </div>
        </div>
      </div>

      {/* Ready Matches */}
      {readyMatches.length > 0 && (
        <div className="bg-gray-800/40 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Ready to Play</h4>
          <div className="grid gap-4 md:grid-cols-2">
            {readyMatches.map((match) => (
              <MatchCard
                key={match._id}
                match={match}
                isOwner={isOwner}
                onUpdateResult={() => {
                  setSelectedMatch(match);
                  setShowResultForm(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Matches */}
      {completedMatches.length > 0 && (
        <div className="bg-gray-800/40 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Completed Matches</h4>
          <div className="grid gap-4 md:grid-cols-2">
            {completedMatches.slice(-6).map((match) => (
              <MatchCard key={match._id} match={match} isOwner={false} showResult={true} />
            ))}
          </div>
          {completedMatches.length > 6 && (
            <p className="text-sm text-gray-400 mt-4 text-center">
              Showing last 6 completed matches ({completedMatches.length} total)
            </p>
          )}
        </div>
      )}

      {/* Tournament Winner */}
      {isComplete && (
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg p-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">🏆 Tournament Complete!</h3>
          <p className="text-yellow-100">Congratulations to all participants!</p>
        </div>
      )}

      {/* Match Result Form Modal */}
      {showResultForm && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <MatchResultForm
              match={selectedMatch}
              onSubmit={updateMatchResult}
              onCancel={() => {
                setShowResultForm(false);
                setSelectedMatch(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Match Card Component
interface MatchCardProps {
  match: BracketNode;
  isOwner: boolean;
  onUpdateResult?: () => void;
  showResult?: boolean;
}

function MatchCard({ match, isOwner, onUpdateResult, showResult = false }: MatchCardProps) {
  const getBracketTypeDisplay = (type: BracketNode["bracketType"]) => {
    switch (type) {
      case "winner":
        return "🏆 Winners";
      case "loser":
        return "🥉 Losers";
      case "grand-final":
        return "👑 Grand Final";
      default:
        return "";
    }
  };

  return (
    <div className="bg-gray-700/40 rounded-lg p-4 border border-gray-600">
      <div className="flex justify-between items-start mb-3">
        <div className="text-sm text-gray-400">
          {getBracketTypeDisplay(match.bracketType)} - Round {match.round}
        </div>
        {match.status === "completed" && match.completedAt && (
          <div className="text-xs text-gray-500">{new Date(match.completedAt).toLocaleDateString()}</div>
        )}
      </div>

      <div className="space-y-2">
        <div
          className={`flex justify-between items-center p-2 rounded ${
            match.status === "completed" && match.winner === match.team1
              ? "bg-green-600/20 border border-green-600/40"
              : "bg-gray-600/40"
          }`}
        >
          <span className="font-medium text-white">{match.team1 || "TBD"}</span>
          {showResult && match.score1 !== undefined && (
            <span className="text-lg font-bold text-white">{match.score1}</span>
          )}
        </div>

        <div className="text-center text-gray-400 text-sm">vs</div>

        <div
          className={`flex justify-between items-center p-2 rounded ${
            match.status === "completed" && match.winner === match.team2
              ? "bg-green-600/20 border border-green-600/40"
              : "bg-gray-600/40"
          }`}
        >
          <span className="font-medium text-white">{match.team2 || "TBD"}</span>
          {showResult && match.score2 !== undefined && (
            <span className="text-lg font-bold text-white">{match.score2}</span>
          )}
        </div>
      </div>

      {match.status === "pending" && isOwner && onUpdateResult && (
        <button
          onClick={onUpdateResult}
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
        >
          Enter Result
        </button>
      )}

      {match.status === "completed" && match.winner && (
        <div className="mt-3 text-center text-green-400 font-medium">Winner: {match.winner}</div>
      )}
    </div>
  );
}

// Match Result Form Component
interface MatchResultFormProps {
  match: BracketNode;
  onSubmit: (matchId: string, winner: string, score1: number, score2: number) => void;
  onCancel: () => void;
}

function MatchResultForm({ match, onSubmit, onCancel }: MatchResultFormProps) {
  const [winner, setWinner] = useState("");
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!winner) return;
    onSubmit(match._id, winner, score1, score2);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Enter Match Result</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
          <span className="text-white">{match.team1}</span>
          <input
            type="number"
            min="0"
            value={score1}
            onChange={(e) => setScore1(parseInt(e.target.value) || 0)}
            className="w-16 bg-gray-600 text-white text-center rounded px-2 py-1"
          />
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
          <span className="text-white">{match.team2}</span>
          <input
            type="number"
            min="0"
            value={score2}
            onChange={(e) => setScore2(parseInt(e.target.value) || 0)}
            className="w-16 bg-gray-600 text-white text-center rounded px-2 py-1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Winner</label>
        <select
          value={winner}
          onChange={(e) => setWinner(e.target.value)}
          required
          className="w-full bg-gray-700 text-white rounded px-3 py-2"
        >
          <option value="">Select Winner</option>
          <option value={match.team1}>{match.team1}</option>
          <option value={match.team2}>{match.team2}</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!winner}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded transition-colors"
        >
          Save Result
        </button>
      </div>
    </form>
  );
}
