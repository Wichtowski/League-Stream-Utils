import { NextRequest, NextResponse } from "next/server";
import { getGameSession, updateGameSession } from "@lib/database";
import { withAuth } from "@lib/auth";

export const POST = withAuth(async (req: NextRequest, _user) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const sessionId = pathParts[pathParts.length - 2]; // undo is the last part, sessionId is second to last

    const session = await getGameSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const sessionWithActions = session as any;
    const actions = sessionWithActions.actions || [];
    if (actions.length === 0) {
      return NextResponse.json({ error: "No actions to undo" }, { status: 400 });
    }

    // Get the last action
    const lastAction = actions[actions.length - 1];
    const updatedActions = actions.slice(0, -1);

    // Create updated session
    const updatedSession = {
      ...session,
      actions: updatedActions,
      lastActivity: new Date()
    };

    // Remove the action from team-specific data
    if (lastAction.type === "ban") {
      const teamBans = updatedSession.teams[lastAction.team].bans;
      const banIndex = teamBans.indexOf(lastAction.championId);
      if (banIndex > -1) {
        teamBans.splice(banIndex, 1);
      }
    } else if (lastAction.type === "pick") {
      const teamPicks = updatedSession.teams[lastAction.team].picks;
      const pickIndex = teamPicks.indexOf(lastAction.championId);
      if (pickIndex > -1) {
        teamPicks.splice(pickIndex, 1);
      }
    }

    const savedSession = await updateGameSession(sessionId, updatedSession);
    
    if (!savedSession) {
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      undoneAction: lastAction,
      session: savedSession
    });
  } catch (error) {
    console.error("Error undoing action:", error);
    return NextResponse.json({ error: "Failed to undo action" }, { status: 500 });
  }
});
