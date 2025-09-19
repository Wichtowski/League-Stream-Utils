import React from "react";
import { Button } from "@lib/components/common";
import type { Match, MatchStatus } from "@lib/types/match";
import type { Team } from "@lib/types/team";

interface Commentator {
  id: string;
  name: string;
}

interface Prediction {
  username: string;
  prediction: "blue" | "red";
  submittedAt?: string;
}

interface MatchSidebarProps {
  match: Match;
  editing: boolean;
  saving: boolean;
  blueTeam: Team | null;
  redTeam: Team | null;
  teamWins: { team1Wins: number; team2Wins: number };
  commentators: Commentator[];
  newCommentatorId: string;
  assigningCommentator: boolean;
  predictions: Prediction[];
  submittingPrediction: "blue" | "red" | null;
  onStatusChange: (status: MatchStatus) => Promise<boolean>;
  onSwapTeams: () => void;
  onNewCommentatorIdChange: (id: string) => void;
  onAssignCommentator: () => Promise<boolean>;
  onSubmitPrediction: (side: "blue" | "red") => Promise<boolean>;
}

export const MatchSidebar: React.FC<MatchSidebarProps> = ({
  match,
  editing,
  saving,
  blueTeam,
  redTeam,
  teamWins,
  commentators,
  newCommentatorId,
  assigningCommentator,
  predictions,
  submittingPrediction,
  onStatusChange,
  onSwapTeams,
  onNewCommentatorIdChange,
  onAssignCommentator,
  onSubmitPrediction
}) => {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Change Match Status</h3>
        <div className="space-y-3">
          {match.status !== "scheduled" && (
            <Button
              onClick={() => onStatusChange("scheduled")}
              variant="secondary"
              className="w-full"
            >
              Schedule Match
            </Button>
          )}
          {match.status !== "in-progress" && (
            <Button
              onClick={() => onStatusChange("in-progress")}
              variant="secondary"
              className="w-full"
            >
              Start Match
            </Button>
          )}
          {match.status !== "completed" && (
            <Button
              onClick={() => onStatusChange("completed")}
              variant="secondary"
              className="w-full"
            >
              Complete Match
            </Button>
          )}
          {match.status !== "cancelled" && (
            <Button
              onClick={() => onStatusChange("cancelled")}
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
          <Button onClick={onSwapTeams} variant="secondary" size="sm" disabled={saving || !match}>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNewCommentatorIdChange(e.target.value)}
              />
              <Button onClick={onAssignCommentator} disabled={assigningCommentator || !newCommentatorId} size="sm" variant="secondary">
                {assigningCommentator ? "Assigning..." : "Add"}
              </Button>
            </div>
          )}
        </div>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">Predictions</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={() => onSubmitPrediction("blue")} size="sm" disabled={submittingPrediction !== null} variant="secondary">
              {submittingPrediction === "blue" ? "Submitting..." : "Predict Blue"}
            </Button>
            <Button onClick={() => onSubmitPrediction("red")} size="sm" disabled={submittingPrediction !== null} variant="secondary">
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
  );
};
