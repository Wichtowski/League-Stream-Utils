import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { registerTeamForTournament, unregisterTeamFromTournament, getTournamentById } from "@lib/database/tournament";
import { getTeamById, getAllTeams } from "@lib/database/team";
import { JWTPayload } from "@lib/types/auth";

export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const teams = await getAllTeams();

    const { getAllTournaments } = await import("@lib/database/tournament");
    const tournaments = await getAllTournaments();

    return NextResponse.json({
      teams,
      tournaments
    });
  } catch (error) {
    console.error("Error fetching teams and tournaments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const {
      tournamentId,
      teamId
    }: {
      tournamentId: string;
      teamId: string;
    } = await req.json();

    if (!tournamentId || !teamId) {
      return NextResponse.json({ error: "Tournament ID and Team ID are required" }, { status: 400 });
    }

    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const updatedTournament = await registerTeamForTournament(tournamentId, teamId, true);

    if (!updatedTournament) {
      return NextResponse.json({ error: "Failed to register team" }, { status: 400 });
    }

    return NextResponse.json({
      message: `Team "${team.name}" registered to tournament "${tournament.name}" by admin`,
      tournament: updatedTournament,
      team: team
    });
  } catch (error) {
    console.error("Error in admin team registration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// DELETE /api/v1/admin/tournaments/register - Admin unregister team from tournament
export const DELETE = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { tournamentId, teamId }: { tournamentId: string; teamId: string } = await req.json();

    if (!tournamentId || !teamId) {
      return NextResponse.json({ error: "Tournament ID and Team ID are required" }, { status: 400 });
    }

    const updatedTournament = await unregisterTeamFromTournament(tournamentId, teamId);

    if (!updatedTournament) {
      return NextResponse.json({ error: "Tournament not found or team not registered" }, { status: 404 });
    }

    const team = await getTeamById(teamId);
    return NextResponse.json({
      message: `Team "${team?.name}" unregistered from tournament by admin`,
      tournament: updatedTournament
    });
  } catch (error) {
    console.error("Error in admin team unregistration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
