import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { PermissionService } from "@lib/services/permissions";
import type { JWTPayload } from "@lib/types/auth";

// GET /api/v1/permissions/grantable?resourceId=...
export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId") || undefined;

    const roles = await PermissionService.getGrantableRoles(user.userId, resourceId || undefined);
    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error fetching grantable roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});


