"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useTeams } from "@lib/contexts/TeamsContext";
import { TeamEditForm } from "@lib/components/features/teams/TeamEditForm";
import { PageWrapper } from "@lib/layout/PageWrapper";

const TeamEditPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const teamid = params.teamid as string;
  const { teams, updateTeam } = useTeams();

  const team = teams.find((t) => t.id === teamid);

  if (!team) return <div>Team not found</div>;

  return (
    <PageWrapper
      loadingMessage="Loading team..."
      breadcrumbs={[
        { label: "Teams", href: "/modules/teams" },
        { label: team.name, href: `/modules/teams/${teamid}`, isActive: true }
      ]}
    >
      <TeamEditForm
        team={team}
        onSave={async (updatedTeam) => {
          await updateTeam(team.id, updatedTeam);
          router.push("/modules/teams");
        }}
        onCancel={() => router.push("/modules/teams")}
      />
    </PageWrapper>
  );
};

export default TeamEditPage;
