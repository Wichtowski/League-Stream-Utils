"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@lib/contexts/AuthContext";
import { useElectron } from "@/libElectron/contexts/ElectronContext";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  loadingComponent?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = "/login",
  requireAuth = true,
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
      if (typeof window !== "undefined" && pathname !== "/login") {
        sessionStorage.setItem("returnTo", pathname);
      }
      router.replace(redirectTo);
    }
  }, [authState.shouldRedirect, redirectTo, router, pathname]);

  // Show loading while checking auth or Electron status
  if (authState.shouldShowLoading) {
    return loadingComponent;
  }

  // Don't render children if auth is required but user is not authenticated
  if (authState.authRequired && !user) {
    return null;
  }

  return <>{children}</>;
};
