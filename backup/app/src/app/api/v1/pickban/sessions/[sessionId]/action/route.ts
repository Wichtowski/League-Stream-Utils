import { NextRequest, NextResponse } from "next/server";
import { getGameSession, updateGameSession } from "@lib/database";
import { withAuth } from "@lib/auth";
import { getChampionById } from "@lib/champions";

export const POST = withAuth(async (req: NextRequest, _user) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const sessionId = pathParts[pathParts.length - 2]; // action is the last part, sessionId is second to last
    const body = await req.json();

    const { type, teamSide, championId } = body;

    if (!type || !teamSide) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await getGameSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Handle different action types
    switch (type) {
      case "ready":
        // Mark team as ready
        const updatedReadiness = {
          blue: session.teamReadiness?.blue || false,
          red: session.teamReadiness?.red || false,
          [teamSide]: true
        };

        await updateGameSession(sessionId, {
          teamReadiness: updatedReadiness,
          lastActivity: new Date()
        });

        // Check if both teams are ready
        if (updatedReadiness.blue && updatedReadiness.red) {
          await updateGameSession(sessionId, {
            sessionState: "ready",
            lastActivity: new Date()
          });
        }

        return NextResponse.json({
          success: true,
          teamReadiness: updatedReadiness,
          bothReady: updatedReadiness.blue && updatedReadiness.red
        });

      case "pick":
      case "ban":
        if (!championId) {
          return NextResponse.json({ error: "Champion ID required for pick/ban actions" }, { status: 400 });
        }

        // Validate it's the team's turn
        if (session.currentTeam !== teamSide) {
          return NextResponse.json({ error: "Not your turn" }, { status: 400 });
        }

        const champion = await getChampionById(championId);
        if (!champion) {
          return NextResponse.json({ error: "Champion not found" }, { status: 404 });
        }

        // Add to team's bans/picks
        const updatedTeams = {
          ...session.teams,
          [teamSide]: {
            ...session.teams[teamSide as keyof typeof session.teams],
            [type === "ban" ? "bans" : "picks"]: [
              ...(session.teams[teamSide as keyof typeof session.teams][type === "ban" ? "bans" : "picks"] || []),
              champion
            ]
          }
        };

        // Advance to next turn
        const nextTeam = teamSide === "blue" ? "red" : "blue";
        const nextTurnNumber = session.turnNumber + 1;

        await updateGameSession(sessionId, {
          teams: updatedTeams,
          currentTeam: nextTeam,
          turnNumber: nextTurnNumber,
          lastActivity: new Date()
        });

        return NextResponse.json({
          success: true,
          teamSide,
          champion,
          nextTeam,
          turnNumber: nextTurnNumber,
          teams: updatedTeams
        });

      default:
        return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error performing action:", error);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
});
