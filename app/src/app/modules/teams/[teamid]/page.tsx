"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useModal, useUser } from "@lib/contexts";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { TeamCard, TeamEditForm } from "@libTeam/components";
import type { CreateTeamRequest, Team } from "@lib/types";
import { Button } from "@lib/components/common";

const TeamEditPage: React.FC = () => {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;
  const router = useRouter();

  const { showAlert, showConfirm } = useModal();
  const user = useUser();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [verifyingPlayers, setVerifyingPlayers] = useState<Set<string>>(new Set());
  const [verifyingAllTeams, setVerifyingAllTeams] = useState<Set<string>>(new Set());
  const [showEditForm, setShowEditForm] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // Direct API fetch instead of relying on broken context
  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) return;
      
      try {
        setLoading(true);
        console.log("Fetching team with ID:", teamId);

        console.log("Making API call to:", `/api/v1/teams/${teamId}`);
        const response = await authenticatedFetch(`/api/v1/teams/${teamId}`);
        
        console.log("Response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Team data received:", data);
          if (data.team) {
            setTeam(data.team);
          } else {
            console.error("No team data in response");
            setTeam(null);
          }
        } else if (response.status === 404) {
          console.error("Team not found");
          setTeam(null);
        } else if (response.status === 403) {
          console.error("Access forbidden");
          setTeam(null);
        } else {
          console.error("Failed to fetch team:", response.status);
          setTeam(null);
        }
      } catch (error) {
        console.error("Error fetching team:", error);
        setTeam(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId, authenticatedFetch]);

  if (loading) {
    return (
      <PageWrapper
        title="Loading team..."
        breadcrumbs={[
          { label: "Teams", href: "/modules/teams" },
          { label: teamId, href: "/modules/teams", isActive: true }
        ]}
        loading
      >
        <></>
      </PageWrapper>
    );
  }

  if (!team) {
    return (
      <PageWrapper
        title="Team not found"
        breadcrumbs={[
          { label: "Teams", href: "/modules/teams" },
          { label: teamId || "Unknown", href: "/modules/teams", isActive: true }
        ]}
      >
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Team Not Found</h2>
          <p className="text-gray-400 mb-4">The team you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Button
            onClick={() => router.push("/modules/teams")}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Back to Teams
          </Button>
        </div>
      </PageWrapper>
    );
  }
  const handleVerifyPlayer = async (teamId: string, playerId: string, playerName: string, playerTag: string) => {
    if (!teamId || !playerId || !playerName || !playerTag) {
      await showAlert({
        type: "error",
        message: "Missing required data for player verification"
      });
      return;
    }

    setVerifyingPlayers((prev) => new Set(prev).add(playerId));
    try {
      const response = await authenticatedFetch(`/api/v1/teams/${teamId}/players/${playerId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ playerName, playerTag })
      });
      
      if (response.ok) {
        await showAlert({
          type: "success",
          message: `Player ${playerName}${playerTag} verified successfully!`
        });
        // Refresh team data
        const teamResponse = await authenticatedFetch(`/api/v1/teams/${teamId}`);
        if (teamResponse.ok) {
          const data = await teamResponse.json();
          setTeam(data.team);
        }
      } else {
        const errorData = await response.json();
        await showAlert({
          type: "error",
          message: errorData.error || "Failed to verify player"
        });
      }
    } catch (error) {
      console.error("Failed to verify player:", error);
      await showAlert({
        type: "error",
        message: "Failed to verify player"
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
    if (!team || !team.id) {
      await showAlert({
        type: "error",
        message: "Invalid team data"
      });
      return;
    }

    setVerifyingAllTeams((prev) => new Set(prev).add(team.id));
    try {
      const response = await authenticatedFetch(`/api/v1/teams/${team.id}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ verified: true, verifyPlayers: true })
      });
      
      if (response.ok) {
        await showAlert({
          type: "success",
          message: "All players verified successfully!"
        });
        // Refresh team data
        const teamResponse = await authenticatedFetch(`/api/v1/teams/${team.id}`);
        if (teamResponse.ok) {
          const data = await teamResponse.json();
          setTeam(data.team);
        }
      } else {
        const errorData = await response.json();
        console.error("Verification failed:", errorData.error);
        await showAlert({
          type: "error",
          message: `Failed to verify team: ${errorData.error || "Unknown error"}`
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
    if (!team || !team.id) {
      await showAlert({
        type: "error",
        message: "Invalid team data"
      });
      return;
    }

    const confirmed = await showConfirm({
      title: "Admin Verify Team",
      message: `Are you sure you want to admin verify ${team.name}? This will mark all players as verified.`,
      confirmText: "Verify",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    setVerifyingAllTeams((prev) => new Set(prev).add(team.id));
    try {
      const response = await authenticatedFetch(`/api/v1/teams/${team.id}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ verified: true, verifyPlayers: true })
      });
      
      if (response.ok) {
        await showAlert({
          type: "success",
          message: "Team verified successfully!"
        });
        // Refresh team data
        const teamResponse = await authenticatedFetch(`/api/v1/teams/${team.id}`);
        if (teamResponse.ok) {
          const data = await teamResponse.json();
          setTeam(data.team);
        }
      } else {
        const errorData = await response.json();
        console.error("Verification failed:", errorData.error);
        await showAlert({
          type: "error",
          message: `Failed to verify team: ${errorData.error || "Unknown error"}`
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

  const handleEditTeam = () => {
    setShowEditForm(true);
  };

  const handleSaveTeam = async (updatedTeam: Partial<CreateTeamRequest>) => {
    if (!team || !team.id) {
      await showAlert({
        type: "error",
        message: "Invalid team data"
      });
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/v1/teams/${team.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedTeam)
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeam(data.team);
        await showAlert({
          type: "success",
          message: "Team updated successfully!"
        });
        setShowEditForm(false);
      } else {
        const errorData = await response.json();
        await showAlert({
          type: "error",
          message: errorData.error || "Failed to update team"
        });
      }
    } catch (error) {
      console.error("Failed to update team:", error);
      await showAlert({
        type: "error",
        message: "Failed to update team"
      });
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
  };

  return (
    <PageWrapper
      requireAuth={true}
      breadcrumbs={[
        { label: "Teams", href: "/modules/teams" },
        { label: team.name, href: `/modules/teams/${teamId}`, isActive: true }
      ]}
      title={team.name}
      actions={
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/modules/cameras/stream/${team.id}`)}
            variant="secondary"
            className="cursor-pointer bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg text-white"
          >
            Open Cameras
          </Button>
          {(user?.id === team.teamOwnerId || user?.isAdmin) && (
            <Button
              onClick={handleEditTeam}
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
            >
              Edit Team
            </Button>
          )}
        </div>
      }
    >
      {showEditForm ? (
        <TeamEditForm team={team} onSave={handleSaveTeam} onCancel={handleCancelEdit} />
      ) : (
        <TeamCard
          team={team}
          currentUserId={user?.id}
          isAdmin={user?.isAdmin}
          verifyingPlayers={verifyingPlayers}
          verifyingAllTeams={verifyingAllTeams}
          onEditTeam={handleEditTeam}
          onVerifyPlayer={handleVerifyPlayer}
          onVerifyAllPlayers={handleVerifyAllPlayers}
          onAdminVerify={handleAdminVerify}
        />
      )}
    </PageWrapper>
  );
};

export default TeamEditPage;
