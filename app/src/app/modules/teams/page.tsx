"use client";

import { useEffect, useState, useCallback, type ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNavigation } from "@lib/contexts";
import { PageWrapper } from "@lib/layout";
import { TeamListCard } from "@libTeam/components";
import { GridLoader } from "@lib/components/common";
import type { Team } from "@lib/types";

export default function TeamsPage(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setActiveModule } = useNavigation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveModule("teams");
  }, [setActiveModule]);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching teams..."); // Debug log
      const response = await fetch("/api/v1/teams", {
        credentials: "include"
      });

      console.log("Response status:", response.status); // Debug log

      if (response.ok) {
        const data = await response.json();
        console.log("Teams API response:", data); // Debug log
        console.log("Teams array:", data.teams); // Debug log
        console.log("Teams length:", data.teams?.length); // Debug log

        // Debug each team
        if (data.teams && data.teams.length > 0) {
          data.teams.forEach((team: Team, index: number) => {
            console.log(`Team ${index}:`, {
              _id: team._id,
              name: team.name,
              tag: team.tag,
              isStandalone: team.isStandalone,
              hasLogo: !!team.logo
            });
          });
        }

        setTeams(data.teams || []);
      } else if (response.status === 401) {
        // Redirect to login if unauthorized
        router.push("/login");
        return;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Teams API error:", response.status, errorData);
        setError(`Failed to fetch teams: ${response.status} ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      setError(`Failed to fetch teams: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Check if we're returning from team creation and refresh
  useEffect(() => {
    const refresh = searchParams.get("refresh");
    if (refresh === "true") {
      fetchTeams();
      // Clean up the URL
      router.replace("/modules/teams");
    }
  }, [searchParams, fetchTeams, router]);

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

  if (error) {
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
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-red-700 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-300 mb-4">Error Loading Teams</h3>
          <p className="text-red-400 mb-6 max-w-md mx-auto">{error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchTeams}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/modules/teams/create")}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create New Team
            </button>
          </div>
        </div>
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
          <h3 className="text-xl font-semibold text-gray-300 mb-4">No standalone teams created yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Create your first standalone team to get started with tournaments and matches.
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
              .filter((team) => {
                console.log("Filtering team:", team.name, "isStandalone:", team.isStandalone);
                return team && team.name && team.tag && team.isStandalone;
              })
              .map((team) => (
                <TeamListCard key={team._id} team={team} />
              ))}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
