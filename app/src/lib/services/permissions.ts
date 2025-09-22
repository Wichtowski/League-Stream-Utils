import { connectToDatabase } from "@lib/database/connection";
import {
  TournamentPermissionModel,
  PermissionAuditModel,
  PermissionRequestModel,
  type TournamentPermissionDoc,
  type PermissionAuditDoc,
  type PermissionRequestDoc
} from "@lib/database/models";
import {
  Permission,
  Role,
  PermissionCheck,
  PermissionResult,
  roleHasPermission,
  ROLE_PERMISSIONS
} from "@lib/types/permissions";

// Interface for User document with globalRoles
interface UserWithGlobalRoles {
  _id: string;
  globalRoles?: Role[];
  save(): Promise<unknown>;
}

// Permission checking service
export class PermissionService {
  // Check if a user has a specific permission
  static async checkPermission(check: PermissionCheck): Promise<PermissionResult> {

    const { userId, permission, resourceId } = check;

    // Get all active roles for the user
    const userRoles = await this.getUserRoles(userId, resourceId);

    // Check if user has admin all permission
    if (userRoles.some(role => roleHasPermission(role, Permission.ADMIN_ALL))) {
      return { allowed: true, userRoles };
    }

    // Check if any role has the required permission
    const hasPermission = userRoles.some(role => roleHasPermission(role, permission));

    if (hasPermission) {
      return { allowed: true, userRoles };
    }

    // Find what role would be needed
    const requiredRoles = ROLE_PERMISSIONS
      .filter(rp => rp.permissions.includes(permission))
      .map(rp => rp.role);

    return {
      allowed: false,
      reason: `User does not have permission: ${permission}`,
      requiredRole: requiredRoles[0],
      userRoles
    };
  }

  // Get all active roles for a user (global + tournament-specific)
  static async getUserRoles(userId: string, tournamentId?: string): Promise<Role[]> {

    const roles: Role[] = [];

    // Handle special case for "admin" user (hardcoded admin)
    if (userId === "admin") {
      roles.push(Role.SUPER_ADMIN);
      return roles; // Admin has all permissions, no need to check database
    }

    // Get global roles from user document (for quick access)
    const { UserModel } = await import("@lib/database/models");
    const user = await UserModel.findById(userId) as UserWithGlobalRoles | null;
    if (user && user.globalRoles) {
      roles.push(...user.globalRoles);
    }

    // Get tournament-specific permissions if tournamentId is provided
    if (tournamentId) {
      const tournamentPermissions = await TournamentPermissionModel.find({
        userId,
        tournamentId,
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      });

      roles.push(...tournamentPermissions.map(p => p.role as Role));
    }

    return [...new Set(roles)]; // Remove duplicates
  }

  // Grant a role to a user for a specific tournament
  static async grantTournamentRole(
    tournamentId: string,
    userId: string,
    role: Role,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<TournamentPermissionDoc> {

    // Check if permission already exists
    const existing = await TournamentPermissionModel.findOne({
      tournamentId,
      userId
    });

    if (existing) {
      // Update existing permission
      existing.role = role;
      existing.grantedBy = grantedBy;
      existing.grantedAt = new Date();
      existing.expiresAt = expiresAt;
      existing.isActive = true;
      await existing.save();

      // Log the update
      await this.logPermissionAction({
        action: "UPDATE",
        targetUserId: userId,
        targetRole: role,
        performedBy: grantedBy,
        tournamentId
      });

      return existing;
    } else {
      // Create new permission
      const permission = new TournamentPermissionModel({
        tournamentId,
        userId,
        role,
        grantedBy,
        expiresAt,
        isActive: true
      });

      await permission.save();

      // Log the grant
      await this.logPermissionAction({
        action: "GRANT",
        targetUserId: userId,
        targetRole: role,
        performedBy: grantedBy,
        tournamentId
      });

      return permission;
    }
  }

  // Grant a global role to a user
  static async grantGlobalRole(
    userId: string,
    role: Role,
    grantedBy: string,
    _expiresAt?: Date
  ): Promise<boolean> {

    // Handle special case for "admin" user (hardcoded admin)
    if (userId === "admin") {
      // Admin already has all permissions, but log the action
      await this.logPermissionAction({
        action: "GRANT",
        targetUserId: userId,
        targetRole: role,
        performedBy: grantedBy
      });
      return true;
    }

    // Update user's globalRoles array
    const { UserModel } = await import("@lib/database/models");
    const user = await UserModel.findById(userId) as UserWithGlobalRoles | null;
    if (user) {
      if (!user.globalRoles) {
        user.globalRoles = [];
      }
      if (!user.globalRoles.includes(role)) {
        user.globalRoles.push(role);
        await user.save();

        // Log the grant
        await this.logPermissionAction({
          action: "GRANT",
          targetUserId: userId,
          targetRole: role,
          performedBy: grantedBy
        });

        return true;
      }
    }

    return false;
  }

  // Revoke a tournament role from a user
  static async revokeTournamentRole(
    tournamentId: string,
    userId: string,
    revokedBy: string
  ): Promise<boolean> {

    const permission = await TournamentPermissionModel.findOne({
      tournamentId,
      userId
    });

    if (permission) {
      permission.isActive = false;
      await permission.save();

      // Log the revocation
      await this.logPermissionAction({
        action: "REVOKE",
        targetUserId: userId,
        targetRole: permission.role as Role,
        performedBy: revokedBy,
        tournamentId
      });

      return true;
    }

    return false;
  }

  // Revoke a global role from a user
  static async revokeGlobalRole(
    userId: string,
    role: Role,
    revokedBy: string
  ): Promise<boolean> {

    // Handle special case for "admin" user (hardcoded admin)
    if (userId === "admin") {
      // Admin always keeps super admin role, but log the action
      await this.logPermissionAction({
        action: "REVOKE",
        targetUserId: userId,
        targetRole: role,
        performedBy: revokedBy
      });
      return false; // Admin role cannot be revoked
    }

    // Remove role from user's globalRoles array
    const { UserModel } = await import("@lib/database/models");
    const user = await UserModel.findById(userId) as UserWithGlobalRoles | null;
    if (user && user.globalRoles) {
      const originalLength = user.globalRoles.length;
      user.globalRoles = user.globalRoles.filter(r => r !== role);
      
      if (user.globalRoles.length < originalLength) {
        await user.save();

        // Log the revocation
        await this.logPermissionAction({
          action: "REVOKE",
          targetUserId: userId,
          targetRole: role,
          performedBy: revokedBy
        });

        return true;
      }
    }

    return false;
  }

  // Get all users with permissions for a tournament
  static async getTournamentPermissions(tournamentId: string): Promise<TournamentPermissionDoc[]> {

    return await TournamentPermissionModel.find({
      tournamentId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    }).sort({ grantedAt: -1 });
  }

  // Get all global roles for a user
  static async getUserGlobalRoles(userId: string): Promise<Role[]> {

    // Handle special case for "admin" user (hardcoded admin)
    if (userId === "admin") {
      return [Role.SUPER_ADMIN]; // Admin user has super admin role
    }

    const { UserModel } = await import("@lib/database/models");
    const user = await UserModel.findById(userId) as UserWithGlobalRoles | null;
    
    return user?.globalRoles || [];
  }

  // Get all tournament permissions for a user
  static async getUserTournamentPermissions(userId: string): Promise<TournamentPermissionDoc[]> {

    return await TournamentPermissionModel.find({
      userId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    }).sort({ grantedAt: -1 });
  }

  // Request permission for a tournament
  static async requestPermission(
    requesterId: string,
    requestedRole: Role,
    tournamentId: string | undefined,
    reason: string
  ): Promise<PermissionRequestDoc> {

    const request = new PermissionRequestModel({
      requesterId,
      requestedRole,
      tournamentId,
      reason,
      status: "PENDING"
    });

    await request.save();
    return request;
  }

  // Approve a permission request
  static async approvePermissionRequest(
    requestId: string,
    reviewerId: string,
    reviewNotes?: string
  ): Promise<boolean> {

    const request = await PermissionRequestModel.findById(requestId);
    if (!request || request.status !== "PENDING") {
      return false;
    }

    // Grant the requested permission
    if (request.tournamentId) {
      await this.grantTournamentRole(
        request.tournamentId,
        request.requesterId,
        request.requestedRole as Role,
        reviewerId
      );
    } else {
      await this.grantGlobalRole(
        request.requesterId,
        request.requestedRole as Role,
        reviewerId
      );
    }

    // Update request status
    request.status = "APPROVED";
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes;
    await request.save();

    return true;
  }

  // Reject a permission request
  static async rejectPermissionRequest(
    requestId: string,
    reviewerId: string,
    reviewNotes?: string
  ): Promise<boolean> {

    const request = await PermissionRequestModel.findById(requestId);
    if (!request || request.status !== "PENDING") {
      return false;
    }

    request.status = "REJECTED";
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes;
    await request.save();

    return true;
  }

  // Get pending permission requests
  static async getPendingRequests(tournamentId?: string): Promise<PermissionRequestDoc[]> {

    const query: Record<string, unknown> = { status: "PENDING" };
    if (tournamentId) {
      query.tournamentId = tournamentId;
    }

    return await PermissionRequestModel.find(query).sort({ createdAt: -1 });
  }

  // Log permission actions for audit trail
  private static async logPermissionAction(data: {
    action: "GRANT" | "REVOKE" | "UPDATE" | "EXPIRE";
    targetUserId: string;
    targetRole: Role;
    performedBy: string;
    tournamentId?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {

    const audit = new PermissionAuditModel(data);
    await audit.save();
  }

  // Get permission audit log
  static async getPermissionAuditLog(
    userId?: string,
    tournamentId?: string,
    limit: number = 50
  ): Promise<PermissionAuditDoc[]> {

    const query: Record<string, unknown> = {};
    if (userId) query.targetUserId = userId;
    if (tournamentId) query.tournamentId = tournamentId;

    return await PermissionAuditModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // Check if user is tournament owner
  static async isTournamentOwner(tournamentId: string, userId: string): Promise<boolean> {

    const permission = await TournamentPermissionModel.findOne({
      tournamentId,
      userId,
      role: Role.TOURNAMENT_OWNER,
      isActive: true
    });

    return !!permission;
  }

  // Get available roles for a user to grant (based on their permissions)
  static async getGrantableRoles(granterUserId: string, tournamentId?: string): Promise<Role[]> {

    const granterRoles = await this.getUserRoles(granterUserId, tournamentId);
    const grantableRoles: Role[] = [];

    // Super admin can grant any role
    if (granterRoles.includes(Role.SUPER_ADMIN)) {
      return Object.values(Role);
    }

    // Admin can grant most roles except super admin
    if (granterRoles.includes(Role.ADMIN)) {
      grantableRoles.push(
        Role.ADMIN,
        Role.TOURNAMENT_OWNER,
        Role.TOURNAMENT_ADMIN,
        Role.TOURNAMENT_MODERATOR,
        Role.TOURNAMENT_VIEWER,
        Role.COMMENTATOR,
        Role.STREAM_MANAGER,
        Role.DATA_ANALYST,
        Role.USER
      );
    }

    // Tournament owner can grant roles for their tournament
    if (granterRoles.includes(Role.TOURNAMENT_OWNER) && tournamentId) {
      grantableRoles.push(
        Role.TOURNAMENT_ADMIN,
        Role.TOURNAMENT_MODERATOR,
        Role.TOURNAMENT_VIEWER,
        Role.COMMENTATOR,
        Role.STREAM_MANAGER,
        Role.DATA_ANALYST
      );
    }

    // Tournament admin can grant limited roles
    if (granterRoles.includes(Role.TOURNAMENT_ADMIN) && tournamentId) {
      grantableRoles.push(
        Role.TOURNAMENT_MODERATOR,
        Role.TOURNAMENT_VIEWER,
        Role.COMMENTATOR,
        Role.STREAM_MANAGER,
        Role.DATA_ANALYST
      );
    }

    return [...new Set(grantableRoles)]; // Remove duplicates
  }
}
