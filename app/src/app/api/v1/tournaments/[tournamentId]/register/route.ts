import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { registerTeamForTournament, unregisterTeamFromTournament, getTournamentById } from "@/libTournament/database/tournament";
import { getTeamById } from "@libTeam/database";
import { JWTPayload } from "@lib/types/auth";
import { Player } from "@lib/types/game";

export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const tournamentId = req.url.split("/").slice(-2, -1)[0];
    const { teamId }: { teamId: string } = await req.json();

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    // Verify team exists
    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if tournament exists
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Check permissions: user can register teams if they:
    // 1. Own the team, OR
    // 2. Are an admin, OR
    // 3. Are the tournament organizer
    const canRegisterTeam = team.userId === user.userId || user.isAdmin || tournament.userId === user.userId;

    if (!canRegisterTeam) {
      return NextResponse.json(
        {
          error: "You can only register your own teams or teams to tournaments you organize"
        },
        { status: 403 }
      );
    }

    // Admin and tournament organizer bypass: Allow registration even when registration is closed
    const isAdminOrOrganizer = user.isAdmin || tournament.userId === user.userId;
    if (!isAdminOrOrganizer) {
      if (!tournament.registrationOpen || tournament.status !== "registration") {
        return NextResponse.json({ error: "Tournament registration is closed" }, { status: 400 });
      }

      // Check registration deadline only for regular users
      if (
        tournament.requireRegistrationDeadline &&
        tournament.registrationDeadline &&
        new Date() > tournament.registrationDeadline
      ) {
        return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 });
      }
    }

    // Admin and tournament organizer bypass: Allow teams with incomplete rosters
    if (!isAdminOrOrganizer) {
      // Validate team has complete roster
      if (team.players.main.length !== 5) {
        return NextResponse.json({ error: "Team must have a complete 5-player roster to register" }, { status: 400 });
      }
    }

    const updatedTournament = await registerTeamForTournament(tournamentId, teamId, isAdminOrOrganizer);

    if (!updatedTournament) {
      return NextResponse.json(
        {
          error: "Failed to register team. Tournament may be full or registration is closed."
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Team registered successfully",
      tournament: updatedTournament
    });
  } catch (error) {
    console.error("Error registering team:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const tournamentId = req.url.split("/").slice(-2, -1)[0];
    const { teamId }: { teamId: string } = await req.json();

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    // Verify team exists
    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if tournament exists
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Check permissions: user can unregister teams if they:
    // 1. Own the team, OR
    // 2. Are an admin, OR
    // 3. Are the tournament organizer
    const canUnregisterTeam = team.userId === user.userId || user.isAdmin || tournament.userId === user.userId;

    if (!canUnregisterTeam) {
      return NextResponse.json(
        {
          error: "You can only unregister your own teams or teams from tournaments you organize"
        },
        { status: 403 }
      );
    }

    const updatedTournament = await unregisterTeamFromTournament(tournamentId, teamId);

    if (!updatedTournament) {
      return NextResponse.json({ error: "Tournament not found or team not registered" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Team unregistered successfully",
      tournament: updatedTournament
    });
  } catch (error) {
    console.error("Error unregistering team:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
