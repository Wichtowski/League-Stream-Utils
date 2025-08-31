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

  return (
    <PageWrapper
      title={team.name}
      breadcrumbs={[
        { label: "Teams", href: "/modules/teams" },
        { label: team.name, href: `/modules/teams/${team._id}`, isActive: true }
      ]}
    >
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
