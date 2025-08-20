"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TeamCreationForm } from "@libTeam/components";
import { PageWrapper } from "@lib/layout";
import { CreateTeamRequest } from "@lib/types";
import { useNavigation, useTeams, useModal } from "@lib/contexts";

export default function CreateTeamPage() {
  const [creating, setCreating] = useState(false);
  const { setActiveModule } = useNavigation();
  const { createTeam } = useTeams();
  const { showAlert } = useModal();
  const router = useRouter();

  useEffect(() => {
    setActiveModule("teams");
  }, [setActiveModule]);

  const handleCreateTeam = async (formData: CreateTeamRequest) => {
    setCreating(true);
    try {
      const result = await createTeam(formData);
      if (result.success) {
        await showAlert({
          type: "success",
          message: "Team created successfully!"
        });
        router.push("/modules/teams");
      } else {
        await showAlert({
          type: "error",
          message: result.error || "Failed to create team"
        });
      }
    } catch (error) {
      console.error("Failed to create team:", error);
      await showAlert({ type: "error", message: "Failed to create team" });
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    router.push("/modules/teams");
  };

  return (
    <PageWrapper
      title="Create Team"
      breadcrumbs={[
        { label: "Teams", href: "/modules/teams" },
        { label: "Create Team", href: "/modules/teams/create", isActive: true }
      ]}
    >
      <TeamCreationForm onSubmit={handleCreateTeam} isCreating={creating} onCancel={handleCancel} />
    </PageWrapper>
  );
}
