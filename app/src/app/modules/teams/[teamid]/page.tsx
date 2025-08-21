"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTeams, useModal, useUser } from "@lib/contexts";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { TeamCard, TeamEditForm } from "@libTeam/components";
import type { CreateTeamRequest, Team } from "@lib/types";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { Button } from "@lib/components/common";

const TeamEditPage: React.FC = () => {
  const params = useParams<{ teamid: string }>();
  const teamId = params?.teamid;
  const router = useRouter();
  const { teams, updateTeam, verifyPlayer, verifyAllPlayers, refreshTeams } = useTeams();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { showAlert, showConfirm } = useModal();
  const user = useUser();
  const [verifyingPlayers, setVerifyingPlayers] = useState<Set<string>>(new Set());
  const [verifyingAllTeams, setVerifyingAllTeams] = useState<Set<string>>(new Set());
  const [showEditForm, setShowEditForm] = useState(false);
  const [fallbackTeam, setFallbackTeam] = useState<Team | null>(null);
  const [attemptedDirectFetch, setAttemptedDirectFetch] = useState(false);

  const team = teams.find((t) => t.id === teamId) || fallbackTeam || undefined;

  const hasRefreshedRef = useRef(false);
  useEffect(() => {
    if (!team && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      refreshTeams();
    }
  }, [team, refreshTeams]);

  const hasFetchedFallbackRef = useRef(false);
  useEffect(() => {
    const run = async (): Promise<void> => {
      if (!team && teamId && !hasFetchedFallbackRef.current) {
        hasFetchedFallbackRef.current = true;
        try {
          const res = await authenticatedFetch(`/api/v1/teams/${teamId}`);
          if (res.ok) {
            const data = await res.json();
            setFallbackTeam(data.team as Team);
          }
        } finally {
          setAttemptedDirectFetch(true);
        }
      }
    };
    run();
  }, [team, teamId, authenticatedFetch]);

  if (!team && !attemptedDirectFetch) {
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
          { label: teamId , href: "/modules/teams", isActive: true }
        ]}
      >
        <div>Team not found</div>
      </PageWrapper>
    );
  }
  const handleVerifyPlayer = async (teamId: string, playerId: string, playerName: string, playerTag: string) => {
    setVerifyingPlayers((prev) => new Set(prev).add(playerId));
    try {
      const verifyResult = await verifyPlayer(teamId, playerId, playerName, playerTag);
      if (verifyResult.success) {
        await showAlert({
          type: "success",
          message: `Player ${playerName}${playerTag} verified successfully!`
        });
      } else {
        await showAlert({
          type: "error",
          message: verifyResult.error || "Failed to verify player"
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
    setVerifyingAllTeams((prev) => new Set(prev).add(team.id));
    try {
      // First verify all players
      const response = await verifyAllPlayers(team.id);
      if (response.success) {
        // Check if we have enough verified players for auto-verification
        const verifiedPlayerCount = [...team.players.main, ...team.players.substitutes].filter((p) => p.verified).length;
        
        if (verifiedPlayerCount >= 5) {
          // Submit team verification for auto-approval
          try {
            const verificationResponse = await fetch(`/api/v1/teams/${team.id}/submit-verification`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            });

            if (verificationResponse.ok) {
              const verificationData = await verificationResponse.json();
              await showAlert({
                type: "success",
                message: verificationData.status === "verified" 
                  ? `Team verified successfully! (${verificationData.verifiedPlayerCount} players verified)`
                  : `All players verified! Team verification submitted for review.`
              });
            } else {
              console.warn("Team verification submission failed:", verificationResponse.status);
              await showAlert({
                type: "success",
                message: `All players verified successfully! (${verifiedPlayerCount} verified)`
              });
            }
          } catch (verificationError) {
            console.warn("Team verification submission failed:", verificationError);
            await showAlert({
              type: "success",
              message: `All players verified successfully! (${verifiedPlayerCount} verified)`
            });
          }
        } else {
          // Not enough players for auto-verification
          await showAlert({
            type: "success",
            message: `All players verified successfully! (${verifiedPlayerCount} verified, need 5+ for team verification)`
          });
        }
        
      } else {
        console.error("Verification failed:", response.error);
        await showAlert({
          type: "error",
          message: `Failed to verify team: ${response.error || "Unknown error"}`
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
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    setVerifyingAllTeams((prev) => new Set(prev).add(team.id));
    try {
      const response = await verifyAllPlayers(team.id);
      if (response.success) {
        await showAlert({
          type: "success",
          message: "Team verified successfully!"
        });
      } else {
        console.error("Verification failed:", response.error);
        await showAlert({
          type: "error",
          message: `Failed to verify team: ${response.error || "Unknown error"}`
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
    await updateTeam(team.id, updatedTeam);
    setShowEditForm(false);
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
          {(user?.id === team.userId || user?.isAdmin) && (
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
        <TeamEditForm
          team={team}
          onSave={handleSaveTeam}
          onCancel={handleCancelEdit}
        />
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
