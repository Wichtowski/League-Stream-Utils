import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { PermissionService } from "@lib/services/permissions";
import type { JWTPayload } from "@lib/types/auth";
import type { Permission } from "@lib/types/permissions";

// POST /api/v1/permissions/check - Check a specific permission for current or target user
export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const { userId, permission, resourceId } = await req.json();

    const targetUserId: string = userId || user.userId;

    const result = await PermissionService.checkPermission({
      userId: targetUserId,
      permission: permission as Permission,
      resourceId
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking permission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});


