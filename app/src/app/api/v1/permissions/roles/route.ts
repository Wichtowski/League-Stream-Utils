import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { PermissionService } from "@lib/services/permissions";
import type { JWTPayload } from "@lib/types/auth";

// GET /api/v1/permissions/roles?userId=...&resourceId=...
export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || user.userId;
    const resourceId = searchParams.get("resourceId") || undefined;

    const roles = await PermissionService.getUserRoles(targetUserId, resourceId);
    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
