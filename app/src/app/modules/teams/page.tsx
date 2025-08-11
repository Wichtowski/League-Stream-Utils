"use client";

import { useEffect, useState, type ReactElement } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useNavigation, useTeams } from "@lib/contexts";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { getTeamLogoUrl } from "@lib/services/common/image";

export default function TeamsPage(): ReactElement {
  const router = useRouter();
  const { teams, loading, refreshTeams } = useTeams();
  const { setActiveModule } = useNavigation();
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    setActiveModule("teams");
  }, [setActiveModule]);

  useEffect(() => {
    if (!loading && teams.length === 0) {
      refreshTeams();
    }
  }, [loading, teams.length, refreshTeams]);

  // Load team logos from MongoDB - only once when teams change
  useEffect(() => {
    if (teams.length > 0 && Object.keys(teamLogos).length === 0) {
      const loadTeamLogos = async () => {
        const logoPromises = teams
          .filter(team => team && team.name && team.tag && !team.isStandalone)
          .map(async (team) => {
            try {
              const logoSrc = await getTeamLogoUrl(team);
              return { teamId: team.id, logoSrc };
            } catch (error) {
              console.error(`Failed to load logo for team ${team.name}:`, error);
              return { teamId: team.id, logoSrc: "" };
            }
          });

        const results = await Promise.all(logoPromises);
        const newLogos = results.reduce((acc, { teamId, logoSrc }) => {
          acc[teamId] = logoSrc;
          return acc;
        }, {} as Record<string, string>);

        setTeamLogos(newLogos);
      };

      loadTeamLogos();
    }
  }, [teams]); // Remove teamLogos dependency to prevent infinite loop

  return (
    <PageWrapper
      title="My Teams"
      breadcrumbs={[{ label: "Teams", href: "/modules/teams", isActive: true }]}
      actions={
        <button
          onClick={() => router.push("/modules/teams/create")}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
        >
          Create Team
        </button>
      }
    >
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner text="Loading teams..." variant="white" />
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-100">Your Teams</h2>
              <p className="text-gray-400 mt-1">
                {teams.filter(team => team && team.name && team.tag && !team.isStandalone).length} team{teams.filter(team => team && team.name && team.tag && !team.isStandalone).length !== 1 ? 's' : ''} • Click to manage
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teams
              .filter(team => team && team.name && team.tag && !team.isStandalone)
              .map((team) => {
                const logoSrc = teamLogos[team.id] || "";
                const hasValidLogo = logoSrc && logoSrc.trim() !== "";
                
                return (
                  <div
                    key={team.id}
                    onClick={() => router.push(`/modules/teams/${team.id}`)}
                    className="group cursor-pointer bg-gray-800 hover:bg-gray-750 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border border-gray-700 hover:border-gray-600"
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      {/* Team Logo */}
                      <div className="relative">
                        {hasValidLogo ? (
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-700">
                            <Image
                              src={logoSrc}
                              alt={`${team.name} logo`}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                              onError={() => {
                                console.warn(`Failed to load logo for team ${team.name}`);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center text-2xl font-bold text-gray-300">
                            {team.name?.slice(0, 2).toUpperCase() || "??"}
                          </div>
                        )}
                        
                        {/* Team Tier Badge */}
                        <div className="absolute -top-2 -right-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            team.tier === 'professional' 
                              ? 'bg-purple-600 text-white' 
                              : team.tier === 'semi-pro'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-600 text-gray-200'
                          }`}>
                            {team.tier}
                          </span>
                        </div>
                      </div>

                      {/* Team Info */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-100 group-hover:text-white transition-colors">
                          {team.name}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-400">
                            {team.tag} • {team.region}
                          </p>
                          <div className="flex items-center justify-center space-x-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: team.colors?.primary || '#6B7280' }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: team.colors?.secondary || '#4B5563' }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: team.colors?.accent || '#9CA3AF' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Click Indicator */}
                      <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                        Click to manage team
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
