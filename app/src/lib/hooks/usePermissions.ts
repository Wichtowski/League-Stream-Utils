"use client";

import { useState, useEffect, useCallback } from "react";
import { PermissionService } from "@lib/services/permissions";
import { Permission, Role } from "@lib/types/permissions";
import { useAuth } from "@lib/contexts/AuthContext";

interface UsePermissionsReturn {
  hasPermission: (permission: Permission, resourceId?: string) => Promise<boolean>;
  getUserRoles: (resourceId?: string) => Promise<Role[]>;
  canGrantRole: (role: Role, resourceId?: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = useCallback(async (permission: Permission, resourceId?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await PermissionService.checkPermission({
        userId: user._id,
        permission,
        resourceId
      });

      return result.allowed;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Permission check failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getUserRoles = useCallback(async (resourceId?: string): Promise<Role[]> => {
    if (!user) return [];

    try {
      setIsLoading(true);
      setError(null);
      
      return await PermissionService.getUserRoles(user._id, resourceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get user roles");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const canGrantRole = useCallback(async (role: Role, resourceId?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);
      setError(null);
      
      const grantableRoles = await PermissionService.getGrantableRoles(user._id, resourceId);
      return grantableRoles.includes(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check grantable roles");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    hasPermission,
    getUserRoles,
    canGrantRole,
    isLoading,
    error
  };
};

// Hook for checking specific permissions with caching
export const usePermissionCheck = (permission: Permission, resourceId?: string) => {
  const { hasPermission, isLoading, error } = usePermissions();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      const result = await hasPermission(permission, resourceId);
      setHasAccess(result);
    };

    checkPermission();
  }, [permission, resourceId, hasPermission]);

  return {
    hasAccess,
    isLoading,
    error
  };
};

// Hook for getting user roles with caching
export const useUserRoles = (resourceId?: string) => {
  const { getUserRoles, isLoading, error } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const loadRoles = async () => {
      const userRoles = await getUserRoles(resourceId);
      setRoles(userRoles);
    };

    loadRoles();
  }, [resourceId, getUserRoles]);

  return {
    roles,
    isLoading,
    error
  };
};
