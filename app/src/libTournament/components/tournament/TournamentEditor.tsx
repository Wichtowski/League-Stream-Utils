"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tournament, TournamentStatus } from "@libTournament/types";
import { MyTeamRegistration } from "../tournament/MyTeamRegistration";
import { StandaloneTeamManager } from "../standalone/StandaloneTeamManager";
import { PermissionGuard } from "@lib/components/permissions/PermissionGuard";
import { Permission } from "@lib/types/permissions";
import { Button } from "@lib/components/common/button/Button";

interface TournamentEditorProps {
  tournament: Tournament;
  onStatusUpdate: (tournamentId: string, status: TournamentStatus) => void;
  onTournamentUpdate: () => void;
}

const buttonStyle = "px-4 py-2 rounded text-sm cursor-pointer text-black transition";

export const TournamentEditor = ({
  tournament,
  onStatusUpdate,
  onTournamentUpdate
}: TournamentEditorProps): React.ReactElement => {
  const router = useRouter();
  const [showMyTeamRegistration, setShowMyTeamRegistration] = useState(false);
  const [showStandaloneTeamManager, setShowStandaloneTeamManager] = useState(false);

  const getButtonBgStyle = (index: number): React.CSSProperties => {
    const hue = (index * 12) % 360;
    return { backgroundColor: `hsl(${hue} 85% 45%)` };
  };

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
    } catch (_error) {
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

      {/* Actions */}
      {(() => {
        let idx = 0;
        return (
          <>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Organization</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => router.push(`/modules/tournaments/${tournament._id}/matches`)}
                  className={`${buttonStyle}`}
                  hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                  style={getButtonBgStyle(idx++)}
                  variant="custom"
                >
                  Matches
                </Button>

                {(tournament.status === "draft" || tournament.status === "ongoing") && (
                  <Button
                    onClick={() => handleGenerateMatches()}
                    className={`${buttonStyle}`}
                    hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                    style={getButtonBgStyle(idx++)}
                    variant="custom"
                  >
                    Generate {tournament.tournamentFormat === "Ladder" ? "Ladder" : "Matches"}
                  </Button>
                )}

                <Button
                  onClick={() => router.push(`/modules/tournaments/${tournament._id}/standalone`)}
                  className={`${buttonStyle}`}
                  hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                  style={getButtonBgStyle(idx++)}
                  variant="custom"
                >
                  Standalone Teams
                </Button>

                <PermissionGuard permission={Permission.TOURNAMENT_ADMIN} resourceId={tournament._id}>
                  <Button
                    onClick={() => router.push(`/modules/tournaments/${tournament._id}/permissions`)}
                    className={`${buttonStyle}`}
                    hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                    style={getButtonBgStyle(idx++)}
                    variant="custom"
                  >
                    Manage Permissions
                  </Button>
                </PermissionGuard>

                {tournament.status === "draft" && (
                  <Button
                    onClick={() => onStatusUpdate(tournament._id, "registration")}
                    className={`${buttonStyle}`}
                    hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                    style={getButtonBgStyle(idx++)}
                    variant="custom"
                  >
                    Open Registration
                  </Button>
                )}

                {tournament.status === "registration" && (
                  <>
                    <Button
                      onClick={() => onStatusUpdate(tournament._id, "ongoing")}
                      className={`${buttonStyle}`}
                      hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                      style={getButtonBgStyle(idx++)}
                      variant="custom"
                    >
                      Start Tournament
                    </Button>
                    <Button
                      onClick={() => setShowMyTeamRegistration(true)}
                      className={`${buttonStyle}`}
                      hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                      style={getButtonBgStyle(idx++)}
                      variant="custom"
                    >
                      Add Teams
                    </Button>
                    <Button
                      onClick={() => onStatusUpdate(tournament._id, "draft")}
                      className={`${buttonStyle}`}
                      hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                      style={getButtonBgStyle(idx++)}
                      variant="custom"
                    >
                      Close Registration
                    </Button>
                  </>
                )}

                {tournament.status === "ongoing" && (
                  <Button
                    onClick={() => onStatusUpdate(tournament._id, "completed")}
                    className={`${buttonStyle}`}
                    hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                    style={getButtonBgStyle(idx++)}
                    variant="custom"
                  >
                    Complete Tournament
                  </Button>
                )}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Overlay Utilities</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => router.push(`/modules/tournaments/${tournament._id}/sponsors/corner`)}
                  className={`${buttonStyle}`}
                  hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                  style={getButtonBgStyle(idx++)}
                  variant="custom"
                >
                  Sponsors Corner
                </Button>

                <Button
                  onClick={() => router.push(`/modules/tournaments/${tournament._id}/sponsors/banner`)}
                  className={`${buttonStyle}`}
                  hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                  style={getButtonBgStyle(idx++)}
                  variant="custom"
                >
                  Sponsors Banner
                </Button>

                <Button
                  onClick={() => router.push(`/modules/tournaments/${tournament._id}/cameras`)}
                  className={`${buttonStyle}`}
                  hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                  style={getButtonBgStyle(idx++)}
                  variant="custom"
                >
                  Team Cameras
                </Button>

                <Button
                  onClick={() => router.push(`/modules/tournaments/${tournament._id}/ticker`)}
                  className={`${buttonStyle}`}
                  hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                  style={getButtonBgStyle(idx++)}
                  variant="custom"
                >
                  Ticker
                </Button>

                <Button
                  onClick={() => router.push(`/modules/tournaments/${tournament._id}/commentators`)}
                  className={`${buttonStyle}`}
                  hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                  style={getButtonBgStyle(idx++)}
                  variant="custom"
                >
                  Add commentators
                </Button>

                <Button
                  onClick={() => router.push(`/modules/tournaments/${tournament._id}/predictions`)}
                  className={`${buttonStyle}`}
                  hoverStyle={getButtonBgStyle(idx++).backgroundColor}
                  style={getButtonBgStyle(idx++)}
                  variant="custom"
                >
                  Predictions
                </Button>
              </div>
            </div>
          </>
        );
      })()}

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
