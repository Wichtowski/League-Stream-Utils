"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Team, CreateTeamRequest } from "@lib/types";
import { useNavigation, useUser, useTeams, useModal } from "@lib/contexts";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { TeamCreationForm, TeamCard } from "@lib/components/pages/teams";

export default function TeamsPage() {
  const user = useUser();
  const router = useRouter();
  const {
    teams,
    loading,
    createTeam,
    verifyPlayer,
    verifyAllPlayers,
    refreshTeams,
  } = useTeams();
  const { showAlert, showConfirm } = useModal();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [verifyingPlayers, setVerifyingPlayers] = useState<Set<string>>(
    new Set(),
  );
  const [verifyingAllTeams, setVerifyingAllTeams] = useState<Set<string>>(
    new Set(),
  );
  const { setActiveModule } = useNavigation();

  useEffect(() => {
    setActiveModule("teams");
    refreshTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateTeam = async (formData: CreateTeamRequest) => {
    setCreating(true);
    try {
      const result = await createTeam(formData);
      if (result.success) {
        setShowCreateForm(false);
        await showAlert({
          type: "success",
          message: "Team created successfully!",
        });
      } else {
        await showAlert({
          type: "error",
          message: result.error || "Failed to create team",
        });
      }
    } catch (error) {
      console.error("Failed to create team:", error);
      await showAlert({ type: "error", message: "Failed to create team" });
    } finally {
      setCreating(false);
    }
  };

  const handleVerifyPlayer = async (
    teamId: string,
    playerId: string,
    playerName: string,
    playerTag: string,
  ) => {
    setVerifyingPlayers((prev) => new Set(prev).add(playerId));
    try {
      const verifyResult = await verifyPlayer(
        teamId,
        playerId,
        playerName,
        playerTag,
      );
      if (verifyResult.success) {
        await showAlert({
          type: "success",
          message: `Player ${playerName}${playerTag} verified successfully!`,
        });
      } else {
        await showAlert({
          type: "error",
          message: verifyResult.error || "Failed to verify player",
        });
      }
    } catch (error) {
      console.error("Failed to verify player:", error);
      await showAlert({
        type: "error",
        message: "Failed to verify player",
      });
    } finally {
      setVerifyingPlayers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
    }
  };

  const handleVerifyAllPlayers = async (team: Team) => {
    setVerifyingAllTeams((prev) => new Set(prev).add(team.id));
    try {
      const response = await verifyAllPlayers(team.id);
      if (response.success) {
        await showAlert({
          type: "success",
          message: "Team verified successfully!",
        });
        refreshTeams();
      } else {
        console.error("Verification failed:", response.error);
        await showAlert({
          type: "error",
          message: `Failed to verify team: ${response.error || "Unknown error"}`,
        });
      }
    } catch (error) {
      console.error("Failed to verify team:", error);
      await showAlert({ type: "error", message: "Failed to verify team" });
    } finally {
      setVerifyingAllTeams((prev) => {
        const newSet = new Set(prev);
        newSet.delete(team.id);
        return newSet;
      });
    }
  };

  const handleAdminVerify = async (team: Team) => {
    const confirmed = await showConfirm({
      title: "Admin Verify Team",
      message: `Are you sure you want to admin verify ${team.name}? This will mark all players as verified.`,
      confirmText: "Verify",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setVerifyingAllTeams((prev) => new Set(prev).add(team.id));
    try {
      const response = await verifyAllPlayers(team.id);
      if (response.success) {
        await showAlert({
          type: "success",
          message: "Team verified successfully!",
        });
        refreshTeams();
      } else {
        console.error("Verification failed:", response.error);
        await showAlert({
          type: "error",
          message: `Failed to verify team: ${response.error || "Unknown error"}`,
        });
      }
    } catch (error) {
      console.error("Failed to verify team:", error);
      await showAlert({ type: "error", message: "Failed to verify team" });
    } finally {
      setVerifyingAllTeams((prev) => {
        const newSet = new Set(prev);
        newSet.delete(team.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <PageWrapper loadingMessage="Loading teams...">
        <LoadingSpinner fullscreen text="Loading teams..." variant="white" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      loadingMessage="Loading teams..."
      breadcrumbs={[
        { label: "Teams", href: "/modules/teams", isActive: true },
      ]}
      title="My Teams"
      actions={teams.length > 0 ? (
        <button
          onClick={() => setShowCreateForm(true)}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
          > 
            Create Team
          </button>
        ) : null
      }
    >
      {showCreateForm && (
        <TeamCreationForm
          onSubmit={handleCreateTeam}
          onCancel={() => setShowCreateForm(false)}
          isCreating={creating}
        />
      )}

      <div className="grid gap-6">
        {teams.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl text-gray-400 mb-4">
              No teams created yet
            </h3>
            <button
              onClick={() => setShowCreateForm(true)}
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
            >
              Create Your First Team
            </button>
          </div>
        ) : (
          teams
            .filter(
              (team) =>
                team &&
                team.name &&
                team.tag &&
                team.players &&
                team.players.main,
            )
            .map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                currentUserId={user?.id}
                isAdmin={user?.isAdmin}
                verifyingPlayers={verifyingPlayers}
                verifyingAllTeams={verifyingAllTeams}
                onEditTeam={(teamId) =>
                  router.push(`/modules/teams/${teamId}`)
                }
                onVerifyPlayer={handleVerifyPlayer}
                onVerifyAllPlayers={handleVerifyAllPlayers}
                onAdminVerify={handleAdminVerify}
              />
            ))
        )}
      </div>
    </PageWrapper>
  );
}
