"use client";

import React, { useState } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@lib/layout";
import { PermissionManager, PermissionRequestManager } from "@lib/components/permissions";
import { LoadingSpinner } from "@lib/components/common";

export default function AdminPermissionsPage(): React.ReactElement {
  const { setActiveModule } = useNavigation();
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"permissions" | "requests">("permissions");
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    setActiveModule("admin");
  }, [setActiveModule]);

  // Redirect non-admin users
  React.useEffect(() => {
    if (user && !user.isAdmin) {
      router.push("/modules");
    }
  }, [user, router]);

  if (!user) {
    return (
      <PageWrapper requireAuth={false}>
        <LoadingSpinner fullscreen text="Loading..." />
      </PageWrapper>
    );
  }

  if (!user.isAdmin) {
    return (
      <PageWrapper requireAuth={false}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl text-red-400 mb-4">Access Denied</h2>
            <p className="text-gray-400 mb-4">Admin privileges required</p>
            <button
              onClick={() => router.push("/modules")}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
            >
              Go to Modules
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const handlePermissionChange = (): void => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <PageWrapper
      title="Global Permissions Management"
      subtitle="Manage user roles and permissions across the entire system"
      breadcrumbs={[
        { label: "Admin", href: "/modules/admin" },
        { label: "Permissions", href: "/modules/admin/permissions", isActive: true }
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
              Global Permissions
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
            key={`global-permissions-${refreshKey}`}
            onPermissionChange={handlePermissionChange}
          />
        )}

        {activeTab === "requests" && (
          <PermissionRequestManager
            key={`global-requests-${refreshKey}`}
            onRequestChange={handlePermissionChange}
          />
        )}

        {/* Admin Info */}
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-red-400 text-xl">⚠️</div>
            <div>
              <h4 className="font-medium text-red-400 mb-1">Admin Warning</h4>
              <p className="text-sm text-red-200">
                You are managing global permissions. Changes here affect the entire system.
                Be careful when granting or revoking permissions as this can impact user access
                across all tournaments and features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
