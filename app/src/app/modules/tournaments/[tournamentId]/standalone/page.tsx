"use client";

import { useEffect, useState, useCallback } from "react";
import { useTournaments } from "@libTournament/contexts/TournamentsContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout";
import { Tournament } from "@libTournament/types";
import { Team, CreateTeamRequest  } from "@libTeam/types";
import { TeamCreationForm } from "@libTeam/components/TeamCreationForm";
import { useParams } from "next/navigation";

export default function TournamentStandaloneTeamsPage() {
  const { tournaments, loading: tournamentsLoading, error, refreshTournaments } = useTournaments();
  const { setActiveModule } = useNavigation();
  const { showAlert, showConfirm } = useModal();
  const [tournament, setTournament] = useState<Tournament>();
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const tournamentId = params.tournamentId as string;

  // Team management state
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [registering, setRegistering] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);

  useEffect(() => {
    setActiveModule("tournaments");
  }, [setActiveModule]);

  useEffect(() => {
    if (!tournamentsLoading && tournaments.length > 0 && tournamentId) {
      const foundTournament = tournaments.find((t) => t._id === tournamentId);
      if (foundTournament) {
        setTournament(foundTournament);
      }
      setLoading(false);
    }
  }, [tournaments, tournamentsLoading, tournamentId]);

  useEffect(() => {
    if (error) {
      showAlert({ type: "error", message: error });
    }
  }, [error, showAlert]);

  const fetchTeams = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/v1/teams/all", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      } else {
        await showAlert({ type: "error", message: "Failed to fetch teams" });
      }
    } catch (error) {
      await showAlert({ type: "error", message: "Failed to fetch teams" });
      console.error("Failed to fetch teams:", error);
    } finally {
      setTeamsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    if (tournamentId) {
      fetchTeams();
    }
  }, [fetchTeams, tournamentId]);

  const handleCreateTeam = useCallback(
    async (teamData: CreateTeamRequest): Promise<void> => {
      setCreatingTeam(true);
      try {
        // Add standalone team flags
        const standaloneTeamData = {
          ...teamData,
          isStandalone: true,
          tournamentId: tournamentId
        };

        const response = await fetch("/api/v1/teams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(standaloneTeamData)
        });

        const data = await response.json();

        if (response.ok) {
          await showAlert({
            type: "success",
            message: "Team created successfully"
          });
          await fetchTeams();
          setShowCreateForm(false);
          setSelectedTeam(data.team._id);
        } else {
          await showAlert({
            type: "error",
            message: data.error || "Failed to create team"
          });
        }
      } catch (error) {
        await showAlert({ type: "error", message: "Failed to create team" });
        console.error("Failed to create team:", error);
      } finally {
        setCreatingTeam(false);
      }
    },
    [showAlert, fetchTeams, tournamentId]
  );

  const handleRegisterTeam = useCallback(async (): Promise<void> => {
    if (!selectedTeam) {
      await showAlert({ type: "error", message: "Please select a team" });
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ teamId: selectedTeam })
      });

      const data = await response.json();

      if (response.ok) {
        await showAlert({ type: "success", message: data.message });
        refreshTournaments();
        setSelectedTeam("");
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
  }, [tournamentId, selectedTeam, showAlert, refreshTournaments]);

  const handleUnregisterTeam = useCallback(
    async (teamId: string): Promise<void> => {
      const confirmed = await showConfirm({
        title: "Remove Team",
        message: "Are you sure you want to remove this team from the tournament?",
        confirmText: "Remove",
        cancelText: "Cancel"
      });

      if (!confirmed) return;

      try {
        const response = await fetch(`/api/v1/tournaments/${tournamentId}/register`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ teamId })
        });

        const data = await response.json();

        if (response.ok) {
          await showAlert({ type: "success", message: data.message });
          refreshTournaments();
        } else {
          await showAlert({
            type: "error",
            message: data.error || "Failed to remove team"
          });
        }
      } catch (error) {
        await showAlert({
          type: "error",
          message: "Failed to remove team"
        });
        console.error("Failed to remove team:", error);
      }
    },
    [tournamentId, showAlert, showConfirm, refreshTournaments]
  );

  const selectedTeamData = teams.find((t) => t._id === selectedTeam);

  if (loading || tournamentsLoading) {
    return (
      <PageWrapper>
        <LoadingSpinner fullscreen text="Loading tournament..." />
      </PageWrapper>
    );
  }

  if (!tournament) {
    return (
      <PageWrapper
        title="Tournament Not Found"
        subtitle="The tournament you're looking for doesn't exist or you don't have access to it."
      >
        <div className="text-center">
          <p className="text-gray-400">
            The tournament you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Tournaments", href: `/modules/tournaments` },
        { label: tournament.name, href: `/modules/tournaments/${tournamentId}` },
        { label: "Standalone Teams", href: `/modules/tournaments/${tournamentId}/standalone`, isActive: true }
      ]}
      title="Manage Standalone Teams"
      subtitle={`${tournament.name} (${tournament.abbreviation})`}
    >
      <div className="space-y-6">
        {/* Team Creation Section */}
        {!showCreateForm && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Create New Team</h3>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
              >
                Create New Team
              </button>
            </div>
          </div>
        )}

        {/* Team Creation Form */}
        {showCreateForm && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Create New Team</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <TeamCreationForm
              onSubmit={handleCreateTeam}
              onCancel={() => setShowCreateForm(false)}
              isCreating={creatingTeam}
            />
          </div>
        )}

        {/* Team Selection and Registration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Teams */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Available Teams</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {teamsLoading ? (
                <LoadingSpinner text="Loading teams..." />
              ) : teams.length > 0 ? (
                teams.map((team) => (
                  <div
                    key={team._id}
                    onClick={() => setSelectedTeam(team._id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTeam === team._id
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{team.name}</div>
                        <div className="text-sm opacity-75">({team.tag})</div>
                      </div>
                      <div className="text-sm opacity-75">{team.players.main.length}/5 players</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No teams available</p>
              )}
            </div>
          </div>

          {/* Registration Action */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Register Team</h3>
            {selectedTeamData ? (
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Selected Team</h4>
                  <div className="text-sm text-gray-300">
                    <p>
                      <strong>Name:</strong> {selectedTeamData.name}
                    </p>
                    <p>
                      <strong>Tag:</strong> {selectedTeamData.tag}
                    </p>
                    <p>
                      <strong>Players:</strong> {selectedTeamData.players.main.length}/5
                    </p>
                    <p>
                      <strong>Region:</strong> {selectedTeamData.region}
                    </p>
                    <p>
                      <strong>Tier:</strong> {selectedTeamData.tier}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRegisterTeam}
                  disabled={registering}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg"
                >
                  {registering ? "Registering..." : "Register Team"}
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>Select a team from the left to register it</p>
              </div>
            )}
          </div>
        </div>

        {/* Registered Teams */}
        {tournament.registeredTeams && tournament.registeredTeams.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Registered Teams ({tournament.registeredTeams.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tournament.registeredTeams.map((teamId) => {
                const team = teams.find((t) => t._id === teamId);
                return (
                  <div key={teamId} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                    <div>
                      <span className="text-white font-medium">{team?.name || "Unknown Team"}</span>
                      <span className="text-gray-400 ml-2">({team?.tag || "N/A"})</span>
                      {team && <span className="text-gray-400 ml-2">• {team.players.main.length}/5 players</span>}
                    </div>
                    <button
                      onClick={() => handleUnregisterTeam(teamId)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
