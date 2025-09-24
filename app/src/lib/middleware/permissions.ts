import { NextRequest, NextResponse } from "next/server";
import { PermissionService } from "@lib/services/permissions";
import { Permission, Role } from "@lib/types/permissions";
import { JWTPayload } from "@lib/types/auth";

export interface PermissionMiddlewareOptions {
  permission: Permission;
  resourceId?: string;
  allowOwners?: boolean; // Allow if user owns the resource
  allowAdmins?: boolean; // Allow if user is admin
}

// Higher-order function to create permission middleware
export const withPermission = (options: PermissionMiddlewareOptions) => {
  return async (_req: NextRequest, user: JWTPayload, ..._args: unknown[]) => {
    const { permission, resourceId, allowOwners = false, allowAdmins = true } = options;

    // Allow admins by default
    if (allowAdmins && user.isAdmin) {
      return { allowed: true, reason: "Admin access" };
    }

    // Check if user owns the resource (for tournament owners)
    if (allowOwners && resourceId) {
      const isOwner = await PermissionService.isTournamentOwner(resourceId, user.userId);
      if (isOwner) {
        return { allowed: true, reason: "Resource owner" };
      }
    }

    // Check specific permission
    const result = await PermissionService.checkPermission({
      userId: user.userId,
      permission,
      resourceId
    });

    if (!result.allowed) {
      return NextResponse.json(
        { 
          error: "Insufficient permissions", 
          message: result.reason,
          requiredRole: result.requiredRole,
          userRoles: result.userRoles
        },
        { status: 403 }
      );
    }

    return { allowed: true, reason: "Permission granted" };
  };
};

// Specific permission middlewares for common use cases
export const requireTournamentPermission = (permission: Permission) => {
  return withPermission({
    permission,
    allowOwners: true,
    allowAdmins: true
  });
};

export const requireGlobalPermission = (permission: Permission) => {
  return withPermission({
    permission,
    allowAdmins: true
  });
};

export const requireTournamentOwner = () => {
  return withPermission({
    permission: Permission.TOURNAMENT_ADMIN,
    allowOwners: true,
    allowAdmins: true
  });
};

export const requireAdmin = () => {
  return withPermission({
    permission: Permission.ADMIN_ALL,
    allowAdmins: true
  });
};

// Utility function to check permissions in API routes
export const checkPermission = async (
  userId: string,
  permission: Permission,
  resourceId?: string
): Promise<{ allowed: boolean; reason?: string }> => {
  const result = await PermissionService.checkPermission({
    userId,
    permission,
    resourceId
  });

  return {
    allowed: result.allowed,
    reason: result.reason
  };
};

// Utility function to get user roles for a resource
export const getUserRoles = async (
  userId: string,
  resourceId?: string
): Promise<Role[]> => {
  return await PermissionService.getUserRoles(userId, resourceId);
};

// Utility function to check if user can grant a specific role
export const canGrantRole = async (
  granterUserId: string,
  role: Role,
  tournamentId?: string
): Promise<boolean> => {
  const grantableRoles = await PermissionService.getGrantableRoles(granterUserId, tournamentId);
  return grantableRoles.includes(role);
};
