import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { PermissionService } from "@lib/services/permissions";
import { Role } from "@lib/types/permissions";
import { JWTPayload } from "@lib/types/auth";

// GET /api/v1/permissions/global - Get all global permissions for a user
export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || user.userId;

    // Only allow users to view their own permissions unless they're admin
    if (targetUserId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const roles = await PermissionService.getUserGlobalRoles(targetUserId);

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error fetching global permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// POST /api/v1/permissions/global - Grant global permission to a user
export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const { userId, role, expiresAt } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        {
          error: "User ID and role are required"
        },
        { status: 400 }
      );
    }

    // Only admins can grant global permissions
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const success = await PermissionService.grantGlobalRole(
      userId,
      role as Role,
      user.userId,
      expiresAt ? new Date(expiresAt) : undefined
    );

    if (success) {
      return NextResponse.json({
        message: "Global role granted successfully"
      });
    } else {
      return NextResponse.json(
        {
          error: "Failed to grant global role"
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error granting global permission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// DELETE /api/v1/permissions/global - Revoke global permission from a user
export const DELETE = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        {
          error: "User ID and role are required"
        },
        { status: 400 }
      );
    }

    // Only admins can revoke global permissions
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const success = await PermissionService.revokeGlobalRole(userId, role as Role, user.userId);

    if (success) {
      return NextResponse.json({ message: "Global permission revoked successfully" });
    } else {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error revoking global permission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
