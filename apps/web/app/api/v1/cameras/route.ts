import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { getCameraConfigs } from "@lsu/camera/queries";

import { json, unauthorized } from "@/api/_helpers";

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const configs = await getCameraConfigs(auth.user.userId);

  return json(configs);
}
