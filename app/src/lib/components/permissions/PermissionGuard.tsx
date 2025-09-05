"use client";

import React, { useState, useEffect } from "react";
import { Permission } from "@lib/types/permissions";
import { usePermissionCheck } from "@lib/hooks/usePermissions";
import { LoadingSpinner } from "@lib/components/common";

interface PermissionGuardProps {
  permission: Permission;
  resourceId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  requireAll?: boolean; // If true, requires ALL permissions, if false, requires ANY permission
  permissions?: Permission[]; // Multiple permissions to check
}

export const PermissionGuard = ({ 
  permission, 
  resourceId, 
  fallback, 
  children, 
  requireAll = false,
  permissions 
}: PermissionGuardProps): React.ReactElement => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Use single permission check if only one permission is provided
  const singlePermissionCheck = usePermissionCheck(permission, resourceId);

  useEffect(() => {
    const checkPermissions = async () => {
      setLoading(true);

      if (permissions && permissions.length > 0) {
        // Check multiple permissions
        const { PermissionService } = await import("@lib/services/permissions");
        
        // This is a simplified check - in a real implementation, you'd want to
        // get the current user and check permissions properly
        const results = await Promise.all(
          permissions.map(p => 
            PermissionService.checkPermission({
              userId: "current-user", // This should come from auth context
              permission: p,
              resourceId
            })
          )
        );

        if (requireAll) {
          setHasAccess(results.every(result => result.allowed));
        } else {
          setHasAccess(results.some(result => result.allowed));
        }
      } else {
        // Use single permission check
        setHasAccess(singlePermissionCheck.hasAccess);
      }

      setLoading(false);
    };

    checkPermissions();
  }, [permission, resourceId, permissions, requireAll, singlePermissionCheck.hasAccess]);

  if (loading) {
    return <LoadingSpinner text="Checking permissions..." />;
  }

  if (hasAccess === false) {
    return fallback ? <>{fallback}</> : <></>;
  }

  return <>{children}</>;
};

// Higher-order component for protecting entire components
export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  resourceId?: string,
  fallback?: React.ReactNode
) => {
  const WrappedComponent = (props: P): React.ReactElement => {
    return (
      <PermissionGuard permission={permission} resourceId={resourceId} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
  
  WrappedComponent.displayName = `withPermission(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Component for showing different content based on permissions
interface ConditionalPermissionProps {
  permission: Permission;
  resourceId?: string;
  hasPermission: React.ReactNode;
  noPermission?: React.ReactNode;
  loading?: React.ReactNode;
}

export const ConditionalPermission = ({ 
  permission, 
  resourceId, 
  hasPermission, 
  noPermission, 
  loading 
}: ConditionalPermissionProps): React.ReactElement => {
  const { hasAccess, isLoading } = usePermissionCheck(permission, resourceId);

  if (isLoading) {
    return loading ? <>{loading}</> : <LoadingSpinner text="Checking permissions..." />;
  }

  if (hasAccess) {
    return <>{hasPermission}</>;
  }

  return noPermission ? <>{noPermission}</> : <></>;
};
