"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useModal, useUser } from "@lib/contexts";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { TeamCard, TeamEditForm } from "@libTeam/components";
import { CreateTeamRequest, Team } from "@libTeam/types";
import { Button, LoadingSpinner } from "@lib/components/common";

const TeamEditPage: React.FC = () => {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId;
  const router = useRouter();

  const { showAlert, showConfirm } = useModal();
  const user = useUser();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [showEditForm, setShowEditForm] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const pageProps = useMemo(() => {
    return {
      title: !team ? (loading ? "Loading team..." : "Team not found") : team.name,
      subtitle: "Manage team details and players",
      breadcrumbs: [
        { label: "Teams", href: "/modules/teams" },
        { label: team?.name || "Team", href: `/modules/teams/${teamId}`, isActive: true }
      ]
    }
  }, [team, loading, teamId]);

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
          setTeam(null);
        } else if (response.status === 403) {
          setTeam(null);
        } else {
          setTeam(null);
        }
      } catch (_error) {
        setTeam(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId, authenticatedFetch]);

  const handleEditTeam = () => {
    setShowEditForm(true);
  };

  const handleSaveTeam = async (updatedTeam: Partial<CreateTeamRequest>) => {
    if (!team || !team._id) {
      await showAlert({
        type: "error",
        message: "Invalid team data"
      });
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/v1/teams/${team._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedTeam),
        credentials: "include"
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

  const handleDeleteTeam = async () => {
    if (!team || !team._id) {
      await showAlert({
        type: "error",
        message: "Invalid team data"
      });
      return;
    }

    const confirmed = await showConfirm({
      title: "Delete Team",
      message: `Are you sure you want to delete ${team.name}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    try {
      const response = await authenticatedFetch(`/api/v1/teams/${team._id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        await showAlert({
          type: "success",
          message: "Team deleted successfully!"
        });
        router.push("/modules/teams");
      } else {
        const errorData = await response.json();
        await showAlert({
          type: "error",
          message: errorData.error || "Failed to delete team"
        });
      }
    } catch (error) {
      console.error("Failed to delete team:", error);
      await showAlert({
        type: "error",
        message: "Failed to delete team"
      });
    }
  };

  if (loading) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading Team..." />
      </PageWrapper>
    );
  }

  if (!team) {
    return (
      <PageWrapper {...pageProps}>
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            The team you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
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

  return (
    <PageWrapper {...pageProps}>
      <div className="space-y-6">
        {showEditForm ? (
          <TeamEditForm team={team} onSave={handleSaveTeam} onCancel={() => setShowEditForm(false)} />
        ) : (
          <TeamCard
            team={team}
            currentUserId={user?._id}
            isAdmin={user?.isAdmin}
            onEditTeam={handleEditTeam}
            onDeleteTeam={handleDeleteTeam}
          />
        )}
      </div>
    </PageWrapper>
  );
};

export default TeamEditPage;
