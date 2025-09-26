import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { PermissionService } from "@lib/services/permissions";
import { Permission } from "@lib/types/permissions";
import { JWTPayload } from "@lib/types/auth";
import { PermissionRequestModel } from "@lib/database/models";

// PUT /api/v1/permissions/requests/[requestId] - Approve or reject a permission request
export const PUT = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const requestId = req.nextUrl.pathname.split("/")[6];
    const { action, reviewNotes } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json(
        {
          error: "Request ID and action are required"
        },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          error: "Action must be 'approve' or 'reject'"
        },
        { status: 400 }
      );
    }

    // Get the request to check permissions
    const targetRequest = await PermissionRequestModel.findById(requestId);
    if (targetRequest && targetRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request is not pending" }, { status: 400 });
    }

    if (!targetRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check if user can review this request
    if (targetRequest.tournamentId) {
      const canReview = await PermissionService.checkPermission({
        userId: user.userId,
        permission: Permission.TOURNAMENT_ADMIN,
        resourceId: targetRequest.tournamentId
      });

      if (!canReview.allowed && !user.isAdmin) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
    } else if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    let success = false;
    if (action === "approve") {
      success = await PermissionService.approvePermissionRequest(requestId, user.userId, reviewNotes);
    } else {
      success = await PermissionService.rejectPermissionRequest(requestId, user.userId, reviewNotes);
    }

    if (success) {
      return NextResponse.json({
        message: `Permission request ${action}d successfully`
      });
    } else {
      return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing permission request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
