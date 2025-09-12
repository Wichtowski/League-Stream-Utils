"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ElectronSettings } from "@libElectron/components/settings";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout";
import { useNavigation } from "@lib/contexts/NavigationContext";

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isElectron, setIsElectron] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { setActiveModule } = useNavigation();

  useEffect(() => {
    setActiveModule("settings");
  }, [setActiveModule]);

  useEffect(() => {
    const electronCheck = typeof window !== "undefined" && !!window.electronAPI?.isElectron;
    setIsElectron(electronCheck);
    setIsInitialized(true);
    // Redirect non-admin users in browser mode
    if (typeof window !== "undefined" && !electronCheck && !authLoading && !user?.isAdmin) {
      router.push("/modules");
    }
  }, [user, router, authLoading]);

  // Show loading state while initializing or auth is loading
  if (!isInitialized || authLoading) {
    return <LoadingSpinner fullscreen text="Loading..." />;
  }

  // Redirect non-admin users in browser mode
  if (!isElectron && !user?.isAdmin) {
    return <div className="flex justify-center items-center min-h-screen">Redirecting...</div>;
  }

  return (
    <PageWrapper
      title="Tournament Management Settings"
      subtitle="Configure Riot API integration, tournament templates for professional esports production."
      className="max-w-6xl mx-auto"
      breadcrumbs={[
        { label: "Settings", href: "/settings", isActive: true }
      ]}
    >
      <ElectronSettings />
    </PageWrapper>
  );
}
