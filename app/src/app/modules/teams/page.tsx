"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@lib/contexts";
import { PageWrapper } from "@lib/layout";
import { TeamListCard } from "@libTeam/components";
import { GridLoader } from "@lib/components/common";
import type { Team } from "@lib/types";

export default function TeamsPage(): ReactElement {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveModule("teams");
  }, [setActiveModule]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch("/api/v1/teams", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams || []);   
        } else {
          setError("Failed to fetch teams");
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        setError("Failed to fetch teams");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <PageWrapper
        title="My Teams"
        breadcrumbs={[{ label: "Teams", href: "/modules/teams", isActive: true }]}
        loading={true}
        loadingChildren={<GridLoader config="teams" rows={3} />}
      >
        <></>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="My Teams"
      breadcrumbs={[{ label: "Teams", href: "/modules/teams", isActive: true }]}
      actions={
        <button
          onClick={() => router.push("/modules/teams/create")}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors "
        >
          Create Team
        </button>
      }
    >
      {teams.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-4">No teams created yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Create your first team to get started with tournaments and matches.
          </p>
          <button
            onClick={() => router.push("/modules/teams/create")}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Create Your First Team
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teams
              .filter((team) => team && team.name && team.tag && !team.isStandalone)
              .map((team) => (
                <TeamListCard key={team.id} team={team} />
              ))}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
