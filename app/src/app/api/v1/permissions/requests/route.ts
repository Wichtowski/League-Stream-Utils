import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { PermissionService } from "@lib/services/permissions";
import { Permission, Role } from "@lib/types/permissions";
import { JWTPayload } from "@lib/types/auth";

// GET /api/v1/permissions/requests - Get pending permission requests
export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get('tournamentId');

    // Check if user can view permission requests
    if (tournamentId) {
      const canView = await PermissionService.checkPermission({
        userId: user.userId,
        permission: Permission.TOURNAMENT_ADMIN,
        resourceId: tournamentId
      });

      if (!canView.allowed && !user.isAdmin) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
    } else if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const requests = await PermissionService.getPendingRequests(tournamentId || undefined);
    
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching permission requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// POST /api/v1/permissions/requests - Create a new permission request
export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const { requestedRole, tournamentId, reason } = await req.json();

    if (!requestedRole || !reason) {
      return NextResponse.json({ 
        error: "Requested role and reason are required" 
      }, { status: 400 });
    }

    const request = await PermissionService.requestPermission(
      user.userId,
      requestedRole as Role,
      tournamentId,
      reason
    );

    return NextResponse.json({ 
      message: "Permission request submitted successfully",
      request 
    });
  } catch (error) {
    console.error("Error creating permission request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
