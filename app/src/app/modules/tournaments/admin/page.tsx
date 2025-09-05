"use client";

import React, { useState } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@lib/layout";
import { AdminTournamentManager } from "@libTournament/components";
import { Button } from "@lib/components/common/button/Button";
import { LoadingSpinner } from "@lib/components/common";

export default function AdminTournamentsPage(): React.ReactElement {
  const { setActiveModule } = useNavigation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showAdminManager, setShowAdminManager] = useState(false);

  React.useEffect(() => {
    setActiveModule("adminTournaments");
  }, [setActiveModule]);

  // Redirect non-admin users
  React.useEffect(() => {
    if (!authLoading && !user?.isAdmin) {
      router.push("/modules/tournaments");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <PageWrapper requireAuth={false}>
        <LoadingSpinner fullscreen text="Loading..." />
      </PageWrapper>
    );
  }

  if (!user?.isAdmin) {
    return (
      <PageWrapper requireAuth={false}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl text-red-400 mb-4">Access Denied</h2>
            <p className="text-gray-400 mb-4">Admin privileges required</p>
            <Button onClick={() => router.push("/modules/tournaments")}>
              Go to Tournaments
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Admin Tournament Manager"
      subtitle="Register any team to any tournament with admin privileges"
      breadcrumbs={[
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: "Admin", href: "/modules/tournaments/admin", isActive: true }
      ]}
      actions={
        <Button
          onClick={() => setShowAdminManager(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Open Admin Manager
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Admin Tournament Registration</h3>
          <p className="text-gray-400 mb-4">
            Use the admin tournament manager to register any team to any tournament, bypassing normal restrictions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">🔧 Admin Bypass Features</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Ignore tournament status and deadlines</li>
                <li>• Bypass team capacity limits</li>
                <li>• Skip player verification requirements</li>
                <li>• Override roster completeness checks</li>
              </ul>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">⚠️ Important Notes</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Use with caution - bypasses all validations</li>
                <li>• Changes are permanent and logged</li>
                <li>• Only available to admin users</li>
                <li>• Can register/unregister teams instantly</li>
              </ul>
            </div>
          </div>

          <Button
            onClick={() => setShowAdminManager(true)}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Open Admin Tournament Manager
          </Button>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-400 text-xl">⚠️</div>
            <div>
              <h4 className="font-medium text-yellow-400 mb-1">Admin Warning</h4>
              <p className="text-sm text-yellow-200">
                This tool bypasses all normal tournament registration validations. 
                Only use when absolutely necessary and ensure you understand the implications.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showAdminManager && (
        <AdminTournamentManager onClose={() => setShowAdminManager(false)} />
      )}
    </PageWrapper>
  );
}
