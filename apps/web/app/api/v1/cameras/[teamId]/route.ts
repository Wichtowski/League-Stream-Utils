import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { getCameraConfig, upsertCameraConfig, deleteCameraConfig } from "@lsu/camera/queries";

import { json, error, unauthorized, notFound, parseBody } from "@/api/_helpers";

interface Params {
  params: Promise<{ teamId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { teamId } = await params;
  const config = await getCameraConfig(teamId, auth.user.userId);
  if (!config) return notFound("Camera config not found");

  return json(config);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { teamId } = await params;
  const body = await parseBody<{
    players: Array<{
      role: "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";
      streamUrl: string;
      playerName?: string;
    }>;
  }>(request);

  if (!body?.players) return error("players array required");

  const config = await upsertCameraConfig({
    teamId,
    userId: auth.user.userId,
    players: body.players,
  });

  return json(config);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { teamId } = await params;
  await deleteCameraConfig(teamId, auth.user.userId);

  return json({ success: true });
}
