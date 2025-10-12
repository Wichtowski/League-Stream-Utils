"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useModal } from "@lib/contexts/ModalContext";
import { Tournament } from "@libTournament/types";
import { Team } from "@libTeam/types";
import { OverlayLoader } from "@lib/components/common";

interface MyTeamRegistrationProps {
  tournament: Tournament;
  onClose: () => void;
  onTeamRegistered: (tournament: Tournament) => void;
}

export const MyTeamRegistration = ({
  tournament,
  onClose,
  onTeamRegistered
}: MyTeamRegistrationProps): React.ReactElement => {
  const { showAlert } = useModal();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMyTeams = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/v1/teams", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyTeams(data.teams);
      } else {
        await showAlert({
          type: "error",
          message: "Failed to fetch your teams"
        });
      }
    } catch (error) {
      await showAlert({ type: "error", message: "Failed to fetch your teams" });
      console.error("Failed to fetch teams:", error);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  const handleRegisterTeam = useCallback(
    async (teamId: string): Promise<void> => {
      setRegistering(true);
      try {
        const response = await fetch(`/api/v1/tournaments/${tournament._id}/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ teamId })
        });

        const data = await response.json();

        if (response.ok) {
          const team = myTeams.find((t) => t._id === teamId);
          await showAlert({
            type: "success",
            message: `Team "${team?.name}" successfully registered to ${tournament.name}!`,
            timeout: 3000
          });
          onTeamRegistered(data.tournament);
        } else {
          await showAlert({
            type: "error",
            message: data.error || "Failed to register team"
          });
        }
      } catch (error) {
        await showAlert({ type: "error", message: "Failed to register team" });
        console.error("Failed to register team:", error);
      } finally {
        setRegistering(false);
      }
    },
    [tournament._id, tournament.name, myTeams, showAlert, onTeamRegistered]
  );

  const handleUnregisterTeam = useCallback(
    async (teamId: string): Promise<void> => {
      setRegistering(true);
      try {
        const response = await fetch(`/api/v1/tournaments/${tournament._id}/register`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ teamId })
        });

        const data = await response.json();

        if (response.ok) {
          const team = myTeams.find((t) => t._id === teamId);
          await showAlert({
            type: "success",
            message: `Team "${team?.name}" unregistered from ${tournament.name}`,
            timeout: 3000
          });
          onTeamRegistered(data.tournament);
        } else {
          await showAlert({
            type: "error",
            message: data.error || "Failed to unregister team"
          });
        }
      } catch (error) {
        await showAlert({
          type: "error",
          message: "Failed to unregister team"
        });
        console.error("Failed to unregister team:", error);
      } finally {
        setRegistering(false);
      }
    },
    [tournament._id, tournament.name, myTeams, showAlert, onTeamRegistered]
  );

  const filteredTeams = myTeams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableTeams = filteredTeams.filter((team) => !tournament.registeredTeams.includes(team._id));
  const registeredTeams = filteredTeams.filter((team) => tournament.registeredTeams.includes(team._id));

  if (loading) {
    return <OverlayLoader text="Loading your teams..." />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Add Teams</h2>
              <p className="text-gray-400 mt-1">Add your teams to {tournament.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Tournament Info */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-white">{tournament.name}</h3>
                <p className="text-sm text-gray-400">{tournament.abbreviation}</p>
                <div className="flex items-center gap-4 text-sm text-gray-300 mt-2">
                  <span>
                    Teams: {tournament.registeredTeams.length}/{tournament.maxTeams}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      tournament.status === "registration"
                        ? "bg-yellow-600"
                        : tournament.status === "ongoing"
                          ? "bg-green-600"
                          : tournament.status === "completed"
                            ? "bg-gray-600"
                            : "bg-red-600"
                    }`}
                  >
                    {tournament.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search your teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500"
            />
          </div>

          {myTeams.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-xl text-gray-400 mb-2">No Teams Found</h3>
              <p className="text-gray-500">You need to create a team first before registering for tournaments.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Available Teams */}
              {availableTeams.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Available Teams ({availableTeams.length})</h3>
                  <div className="grid gap-4">
                    {availableTeams.map((team) => (
                      <TeamRegistrationCard
                        key={team._id}
                        team={team}
                        tournament={tournament}
                        isRegistered={false}
                        onRegister={() => handleRegisterTeam(team._id)}
                        onUnregister={() => handleUnregisterTeam(team._id)}
                        isLoading={registering}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Registered Teams */}
              {registeredTeams.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Already Registered ({registeredTeams.length})
                  </h3>
                  <div className="grid gap-4">
                    {registeredTeams.map((team) => (
                      <TeamRegistrationCard
                        key={team._id}
                        team={team}
                        tournament={tournament}
                        isRegistered={true}
                        onRegister={() => handleRegisterTeam(team._id)}
                        onUnregister={() => handleUnregisterTeam(team._id)}
                        isLoading={registering}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredTeams.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <h3 className="text-xl text-gray-400 mb-2">No Teams Match Search</h3>
                  <p className="text-gray-500">Try adjusting your search terms.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TeamRegistrationCardProps {
  team: Team;
  tournament: Tournament;
  isRegistered: boolean;
  onRegister: () => void;
  onUnregister: () => void;
  isLoading: boolean;
}

function TeamRegistrationCard({ team, isRegistered, onRegister, onUnregister, isLoading }: TeamRegistrationCardProps) {
  return (
    <div className={`bg-gray-700 rounded-lg p-4 border-2 ${isRegistered ? "border-green-600" : "border-gray-600"}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-white">{team.tag}</span>
            </div>
            <div>
              <h4 className="font-semibold text-white">{team.name}</h4>
              <p className="text-sm text-gray-400">[{team.tag}]</p>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs ${
                team.tier === "professional"
                  ? "bg-purple-600"
                  : team.tier === "semi-pro"
                    ? "bg-blue-600"
                    : team.tier === "amateur"
                      ? "bg-green-600"
                      : "bg-gray-600"
              }`}
            >
              {team.tier}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Status</p>
              <div className="space-y-1">
                {isRegistered ? (
                  <p className="text-green-400 text-xs">✅ Added to tournament</p>
                ) : (
                  <p className="text-blue-400 text-xs">Available to add</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="ml-4">
          {isRegistered ? (
            <button
              onClick={onUnregister}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Processing..." : "Remove"}
            </button>
          ) : (
            <button
              onClick={onRegister}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Processing..." : "Add Team"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
