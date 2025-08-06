"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useTeams } from "@lib/contexts/TeamsContext";
import { TeamEditForm } from "@lib/components/pages/teams/TeamEditForm";
import { AuthGuard } from "@/lib/components/auth/AuthGuard";
import { Breadcrumbs } from "@/lib/components/common";

const TeamEditPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const teamid = params.teamid as string;
  const { teams, updateTeam } = useTeams();

  const team = teams.find((t) => t.id === teamid);

  if (!team) return <div>Team not found</div>;

  return (
    <AuthGuard loadingMessage="Loading team...">
      <div className="min-h-screen text-white">
        <div className="container mx-auto px-6 py-8">
          <Breadcrumbs items={[
            { label: "Teams", href: "/modules/teams" },
            { label: team.name, href: `/modules/teams/${teamid}`, isActive: true },
          ]} />
        </div>
      </div>
    <TeamEditForm
      team={team}
      onSave={async (updatedTeam) => {
        await updateTeam(team.id, updatedTeam);
        router.push("/modules/teams");
      }}
      onCancel={() => router.push("/modules/teams")}
    />
    </AuthGuard>
  );
};

export default TeamEditPage;
