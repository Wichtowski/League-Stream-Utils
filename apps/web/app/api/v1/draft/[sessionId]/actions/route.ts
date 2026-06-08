import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { validateAction, getPhaseForTurn, getTeamForTurn } from "@lsu/draft/engine";
import { pushAction, undoLastAction, updateSessionState, getSession } from "@lsu/draft/queries";
import { TOTAL_DRAFT_TURNS } from "@lsu/types";
import type { DraftAction } from "@lsu/types";

import { json, error, unauthorized, notFound, parseBody } from "@/api/_helpers";

interface Params {
  params: Promise<{ sessionId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { sessionId } = await params;
  const body = await parseBody<{
    action: "pick" | "ban" | "undo";
    championId?: number;
  }>(request);

  if (!body?.action) return error("action required");

  const session = await getSession(sessionId);
  if (!session) return notFound("Session not found");

  if (body.action === "undo") {
    const updated = await undoLastAction(sessionId);
    if (!updated) return error("Nothing to undo");

    const newTurn = Math.max(0, session.turnNumber - 1);
    await updateSessionState(sessionId, {
      turnNumber: newTurn,
      currentPhase: getPhaseForTurn(newTurn),
      currentTeam: getTeamForTurn(newTurn),
    });

    return json({ success: true, turnNumber: newTurn });
  }

  if (!body.championId) return error("championId required");

  const validationError = validateAction(
    session.turnNumber,
    body.championId,
    session.actions as DraftAction[],
  );
  if (validationError) return error(validationError);

  const phase = getPhaseForTurn(session.turnNumber);
  const team = getTeamForTurn(session.turnNumber);

  await pushAction(sessionId, {
    type: body.action,
    championId: body.championId,
    teamSide: team,
    phase,
  });

  const nextTurn = session.turnNumber + 1;
  const isCompleted = nextTurn >= TOTAL_DRAFT_TURNS;

  await updateSessionState(sessionId, {
    turnNumber: nextTurn,
    currentPhase: isCompleted ? "completed" : getPhaseForTurn(nextTurn),
    currentTeam: isCompleted ? team : getTeamForTurn(nextTurn),
    status: isCompleted ? "completed" : "active",
    completedAt: isCompleted ? new Date() : undefined,
  });

  return json({ success: true, turnNumber: nextTurn, completed: isCompleted });
}
