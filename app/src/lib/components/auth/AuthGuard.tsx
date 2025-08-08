"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@lib/contexts/AuthContext";
import { useElectron } from "@lib/contexts/ElectronContext";
import { LoadingSpinner, PageLayout } from "@lib/components/common";
import { SettingsCog } from "../common/SettingsCog";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  loadingMessage?: string;
  loadingComponent?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = "/auth",
  requireAuth = true,
  loadingMessage = "Checking authentication...",
  loadingComponent
}) => {
  const { user, isLoading } = useAuth();
  const { isElectron, isElectronLoading, useLocalData } = useElectron();
  const router = useRouter();
  const pathname = usePathname();

  // Memoize the auth requirements to prevent unnecessary recalculations
  const authState = useMemo(() => {
    const isLocalDataMode = isElectron && useLocalData;
    const authRequired = requireAuth && !isLocalDataMode;
    const shouldShowLoading = isLoading || isElectronLoading;
    const shouldRedirect = !shouldShowLoading && authRequired && !user;

    return {
      isLocalDataMode,
      authRequired,
      shouldShowLoading,
      shouldRedirect
    };
  }, [isElectron, useLocalData, requireAuth, isLoading, isElectronLoading, user]);

  useEffect(() => {
    if (authState.shouldRedirect) {
      // Store the current path for returnTo functionality
      if (typeof window !== "undefined" && pathname !== "/auth") {
        sessionStorage.setItem("returnTo", pathname);
      }
      router.replace(redirectTo);
    }
  }, [authState.shouldRedirect, redirectTo, router, pathname]);

  // Show loading while checking auth or Electron status
  if (authState.shouldShowLoading) {
    if (loadingComponent) {
      return (
        <PageLayout
          title="Loading..."
          subtitle="Please wait while we check your authentication..."
          contentClassName="max-w-7xl mx-auto"
          actions={<SettingsCog blured={true} />}
        >
          {loadingComponent}
        </PageLayout>
      );
    }
    return <LoadingSpinner fullscreen text={loadingMessage} />;
  }

  // Don't render children if auth is required but user is not authenticated
  if (authState.authRequired && !user) {
    return null;
  }

  return <>{children}</>;
};
