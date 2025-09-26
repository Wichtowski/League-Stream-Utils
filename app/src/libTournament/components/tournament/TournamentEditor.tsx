"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tournament, TournamentStatus } from "@libTournament/types";
import { MyTeamRegistration } from "../tournament/MyTeamRegistration";
import { StandaloneTeamManager } from "../standalone/StandaloneTeamManager";
import { PermissionGuard } from "@lib/components/permissions/PermissionGuard";
import { Permission } from "@lib/types/permissions";

interface TournamentEditorProps {
  tournament: Tournament;
  onStatusUpdate: (tournamentId: string, status: TournamentStatus) => void;
  onTournamentUpdate: () => void;
}

const buttonStyle = "px-4 py-2 rounded text-sm cursor-pointer";

export const TournamentEditor = ({
  tournament,
  onStatusUpdate,
  onTournamentUpdate
}: TournamentEditorProps): React.ReactElement => {
  const router = useRouter();
  const [showMyTeamRegistration, setShowMyTeamRegistration] = useState(false);
  const [showStandaloneTeamManager, setShowStandaloneTeamManager] = useState(false);

  const handleTournamentUpdated = () => {
    onTournamentUpdate();
    setShowMyTeamRegistration(false);
    setShowStandaloneTeamManager(false);
  };

  const handleGenerateMatches = async () => {
    try {
      const response = await fetch(`/api/v1/tournaments/${tournament._id}/matches/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate matches");
      }

      const result = await response.json();
      alert(`Successfully generated ${result.matches.length} matches for ${tournament.tournamentFormat} format!`);
      onTournamentUpdate();
    } catch (error) {
      console.error("Error generating matches:", error);
      alert(error instanceof Error ? error.message : "Failed to generate matches");
    }
  };

  return (
    <div className="space-y-8">
      {/* Tournament Info */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">{tournament.name}</h3>
            <p className="text-gray-400">{tournament.abbreviation}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded text-sm ${
                tournament.status === "draft"
                  ? "bg-yellow-600"
                  : tournament.status === "registration"
                    ? "bg-blue-600"
                    : tournament.status === "ongoing"
                      ? "bg-green-600"
                      : tournament.status === "completed"
                        ? "bg-gray-600"
                        : "bg-red-600"
              }`}
            >
              {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-400">Format</p>
            <p>
              {tournament.matchFormat} • {tournament.tournamentFormat}
            </p>
            {tournament.fearlessDraft && <p className="text-xs text-blue-400 mt-1">⚔️ Fearless Draft</p>}
          </div>
          <div>
            <p className="text-sm text-gray-400">Teams</p>
            <p>
              {tournament.registeredTeams.length} / {tournament.maxTeams}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Start Date</p>
            <p>{new Date(tournament.startDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Tournament Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push(`/modules/tournaments/${tournament._id}/sponsors`)}
            className={`${buttonStyle} bg-indigo-600 hover:bg-indigo-700`}
          >
            Sponsors
          </button>

          <button
            onClick={() => router.push(`/modules/tournaments/${tournament._id}/ticker`)}
            className={`${buttonStyle} bg-purple-600 hover:bg-purple-700`}
          >
            Ticker
          </button>

          <button
            onClick={() => router.push(`/modules/tournaments/${tournament._id}/commentators`)}
            className={`${buttonStyle} bg-blue-600 hover:bg-blue-700`}
          >
            Add commentators
          </button>

          <button
            onClick={() => router.push(`/modules/tournaments/${tournament._id}/predictions`)}
            className={`${buttonStyle} bg-purple-600 hover:bg-purple-700`}
          >
            Predictions
          </button>

          <button
            onClick={() => router.push(`/modules/tournaments/${tournament._id}/matches`)}
            className={`${buttonStyle} bg-red-600 hover:bg-red-700`}
          >
            Matches
          </button>

          {(tournament.status === "draft" || tournament.status === "ongoing") && (
            <button
              onClick={() => handleGenerateMatches()}
              className={`${buttonStyle} bg-green-600 hover:bg-green-700`}
            >
              Generate {tournament.tournamentFormat === "Ladder" ? "Ladder" : "Matches"}
            </button>
          )}

          <button
            onClick={() => router.push(`/modules/tournaments/${tournament._id}/standalone`)}
            className={`${buttonStyle} bg-orange-600 hover:bg-orange-700`}
          >
            Standalone Teams
          </button>

          <PermissionGuard permission={Permission.TOURNAMENT_ADMIN} resourceId={tournament._id}>
            <button
              onClick={() => router.push(`/modules/tournaments/${tournament._id}/permissions`)}
              className={`${buttonStyle} bg-purple-600 hover:bg-purple-700`}
            >
              Manage Permissions
            </button>
          </PermissionGuard>

          {tournament.status === "draft" && (
            <button
              onClick={() => onStatusUpdate(tournament._id, "registration")}
              className={`${buttonStyle} bg-blue-600 hover:bg-blue-700`}
            >
              Open Registration
            </button>
          )}

          {tournament.status === "registration" && (
            <>
              <button
                onClick={() => onStatusUpdate(tournament._id, "ongoing")}
                className={`${buttonStyle} bg-green-600 hover:bg-green-700`}
              >
                Start Tournament
              </button>
              <button
                onClick={() => setShowMyTeamRegistration(true)}
                className={`${buttonStyle} bg-purple-600 hover:bg-purple-700`}
              >
                Add Teams
              </button>
              <button
                onClick={() => onStatusUpdate(tournament._id, "draft")}
                className={`${buttonStyle} bg-gray-600 hover:bg-gray-700`}
              >
                Close Registration
              </button>
            </>
          )}

          {tournament.status === "ongoing" && (
            <button
              onClick={() => onStatusUpdate(tournament._id, "completed")}
              className={`${buttonStyle} bg-gray-600 hover:bg-gray-700`}
            >
              Complete Tournament
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showMyTeamRegistration && (
        <MyTeamRegistration
          tournament={tournament}
          onClose={() => setShowMyTeamRegistration(false)}
          onTeamRegistered={handleTournamentUpdated}
        />
      )}

      {showStandaloneTeamManager && (
        <StandaloneTeamManager
          tournament={tournament}
          onClose={() => setShowStandaloneTeamManager(false)}
          onTeamAdded={handleTournamentUpdated}
        />
      )}
    </div>
  );
};
