import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { PermissionService } from "@lib/services/permissions";
import { Permission, Role } from "@lib/types/permissions";
import { JWTPayload } from "@lib/types/auth";

// GET /api/v1/permissions/tournament/[tournamentId] - Get all permissions for a tournament
export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const tournamentId = req.nextUrl.pathname.split('/')[5];
    
    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
    }

    // Check if user has permission to view tournament permissions
    const canView = await PermissionService.checkPermission({
      userId: user.userId,
      permission: Permission.TOURNAMENT_VIEW,
      resourceId: tournamentId
    });

    if (!canView.allowed && !user.isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const permissions = await PermissionService.getTournamentPermissions(tournamentId);
    
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Error fetching tournament permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// POST /api/v1/permissions/tournament/[tournamentId] - Grant permission to a user
export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const tournamentId = req.nextUrl.pathname.split('/')[5];
    const { userId, role, expiresAt } = await req.json();

    if (!tournamentId || !userId || !role) {
      return NextResponse.json({ 
        error: "Tournament ID, user ID, and role are required" 
      }, { status: 400 });
    }

    // Check if user can grant this role
    const canGrant = await PermissionService.getGrantableRoles(user.userId, tournamentId);
    if (!canGrant.includes(role as Role)) {
      return NextResponse.json({ 
        error: "You don't have permission to grant this role" 
      }, { status: 403 });
    }

    const permission = await PermissionService.grantTournamentRole(
      tournamentId,
      userId,
      role as Role,
      user.userId,
      expiresAt ? new Date(expiresAt) : undefined
    );

    return NextResponse.json({ 
      message: "Permission granted successfully",
      permission 
    });
  } catch (error) {
    console.error("Error granting tournament permission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// DELETE /api/v1/permissions/tournament/[tournamentId] - Revoke permission from a user
export const DELETE = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const tournamentId = req.nextUrl.pathname.split('/')[5];
    const { userId } = await req.json();

    if (!tournamentId || !userId) {
      return NextResponse.json({ 
        error: "Tournament ID and user ID are required" 
      }, { status: 400 });
    }

    // Check if user can revoke permissions for this tournament
    const canManage = await PermissionService.checkPermission({
      userId: user.userId,
      permission: Permission.TOURNAMENT_ADMIN,
      resourceId: tournamentId
    });

    if (!canManage.allowed && !user.isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const success = await PermissionService.revokeTournamentRole(
      tournamentId,
      userId,
      user.userId
    );

    if (success) {
      return NextResponse.json({ message: "Permission revoked successfully" });
    } else {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error revoking tournament permission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
