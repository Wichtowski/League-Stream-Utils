"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { PageWrapper } from "@lib/layout";
import { PermissionManager, PermissionRequestManager } from "@lib/components/permissions";
import { Permission } from "@lib/types/permissions";
import { LoadingSpinner } from "@lib/components/common";
import { usePermissionCheck } from "@lib/hooks/usePermissions";

export default function TournamentPermissionsPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const { user } = useAuth();
  const tournamentId = params.tournamentId as string;
  
  const [activeTab, setActiveTab] = useState<"permissions" | "requests">("permissions");
  const [refreshKey, setRefreshKey] = useState(0);

  const { hasAccess: canManagePermissions, isLoading } = usePermissionCheck(
    Permission.TOURNAMENT_ADMIN,
    tournamentId
  );

  useEffect(() => {
    setActiveModule("tournaments");
  }, [setActiveModule]);

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!isLoading && !canManagePermissions && !user?.isAdmin) {
      router.push(`/modules/tournaments/${tournamentId}`);
    }
  }, [canManagePermissions, isLoading, user, router, tournamentId]);

  if (isLoading) {
    return (
      <PageWrapper
        title="Tournament Permissions"
        breadcrumbs={[
          { label: "Tournaments", href: "/modules/tournaments" },
          { label: "Tournament", href: `/modules/tournaments/${tournamentId}` },
          { label: "Permissions", href: `/modules/tournaments/${tournamentId}/permissions`, isActive: true }
        ]}
      >
        <LoadingSpinner fullscreen text="Loading permissions..." />
      </PageWrapper>
    );
  }

  if (!canManagePermissions && !user?.isAdmin) {
    return (
      <PageWrapper
        title="Access Denied"
        breadcrumbs={[
          { label: "Tournaments", href: "/modules/tournaments" },
          { label: "Tournament", href: `/modules/tournaments/${tournamentId}` },
          { label: "Permissions", href: `/modules/tournaments/${tournamentId}/permissions`, isActive: true }
        ]}
      >
        <div className="text-center py-12">
          <h2 className="text-2xl text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-4">You don&apos;t have permission to manage tournament permissions</p>
          <button
            onClick={() => router.push(`/modules/tournaments/${tournamentId}`)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
          >
            Back to Tournament
          </button>
        </div>
      </PageWrapper>
    );
  }

  const handlePermissionChange = (): void => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <PageWrapper
      title="Tournament Permissions"
      subtitle="Manage user access and permissions for this tournament"
      breadcrumbs={[
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: "Tournament", href: `/modules/tournaments/${tournamentId}` },
        { label: "Permissions", href: `/modules/tournaments/${tournamentId}/permissions`, isActive: true }
      ]}
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("permissions")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "permissions"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              Permissions
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "requests"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              Permission Requests
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "permissions" && (
          <PermissionManager
            key={`permissions-${refreshKey}`}
            tournamentId={tournamentId}
            onPermissionChange={handlePermissionChange}
          />
        )}

        {activeTab === "requests" && (
          <PermissionRequestManager
            key={`requests-${refreshKey}`}
            tournamentId={tournamentId}
            onRequestChange={handlePermissionChange}
          />
        )}

        {/* Permission Info */}
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-400 text-xl">ℹ️</div>
            <div>
              <h4 className="font-medium text-blue-400 mb-1">Permission Management</h4>
              <p className="text-sm text-blue-200">
                Manage who can access and modify this tournament. Tournament owners have full control,
                while other roles have limited access based on their assigned permissions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
