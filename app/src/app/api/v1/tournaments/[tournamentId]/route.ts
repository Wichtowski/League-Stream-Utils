import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import {
  getTournamentById,
  updateTournament,
  deleteTournament,
  updateTournamentStatus,
  getTournamentStats
} from "@lib/database/tournament";
import type { CreateTournamentRequest, Tournament, TournamentStatus } from "@lib/types";
import { JWTPayload } from "@lib/types/auth";

// GET /api/v1/tournaments/[tournamentId] - Get specific tournament
export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams, pathname } = new URL(req.url);
    const tournamentId = pathname.split("/").pop()!;
    const includeStats = searchParams.get("stats") === "true";

    const tournament = await getTournamentById(tournamentId);

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Public tournaments can be viewed by anyone, private tournaments only by owner
    if (tournament.status === "draft" && tournament.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    let stats;
    if (includeStats) {
      stats = await getTournamentStats(tournamentId);
    }

    return NextResponse.json({ tournament, stats });
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// PUT /api/v1/tournaments/[tournamentId] - Update tournament
export const PUT = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const tournamentId = new URL(req.url).pathname.split("/").pop()!;
    const tournamentData: Partial<CreateTournamentRequest> = await req.json();

    // Validate dates if they're being updated
    if (
      tournamentData.startDate ||
      tournamentData.endDate ||
      tournamentData.registrationDeadline ||
      tournamentData.requireRegistrationDeadline !== undefined
    ) {
      const currentTournament = await getTournamentById(tournamentId);
      if (!currentTournament || (currentTournament.userId !== user.userId && !user.isAdmin)) {
        return NextResponse.json({ error: "Tournament not found or forbidden" }, { status: 404 });
      }

      const startDate = tournamentData.startDate ? new Date(tournamentData.startDate) : currentTournament.startDate;
      const endDate = tournamentData.endDate ? new Date(tournamentData.endDate) : currentTournament.endDate;
      const requireDeadline =
        tournamentData.requireRegistrationDeadline !== undefined
          ? tournamentData.requireRegistrationDeadline
          : currentTournament.requireRegistrationDeadline;

      if (endDate <= startDate) {
        return NextResponse.json({ error: "Tournament end date must be after start date" }, { status: 400 });
      }

      // Only validate registration deadline if it's required
      if (requireDeadline) {
        const registrationDeadline = tournamentData.registrationDeadline
          ? new Date(tournamentData.registrationDeadline)
          : currentTournament.registrationDeadline;

        if (!registrationDeadline) {
          return NextResponse.json(
            {
              error: "Registration deadline is required when deadline is enabled"
            },
            { status: 400 }
          );
        }

        if (registrationDeadline >= startDate) {
          return NextResponse.json({ error: "Registration deadline must be before tournament start" }, { status: 400 });
        }
      }
    }

    // Validate team count if being updated
    if (tournamentData.maxTeams && (tournamentData.maxTeams < 2 || tournamentData.maxTeams > 128)) {
      return NextResponse.json({ error: "Maximum teams must be between 2 and 128" }, { status: 400 });
    }

    // Convert string dates to Date objects for database compatibility
    const processedData: Partial<Tournament> = {
      ...tournamentData,
      startDate: tournamentData.startDate ? new Date(tournamentData.startDate) : undefined,
      endDate: tournamentData.endDate ? new Date(tournamentData.endDate) : undefined,
      registrationDeadline: tournamentData.registrationDeadline
        ? new Date(tournamentData.registrationDeadline)
        : undefined
    };

    const updatedTournament = await updateTournament(tournamentId, processedData);

    if (!updatedTournament) {
      return NextResponse.json({ error: "Tournament not found or forbidden" }, { status: 404 });
    }

    return NextResponse.json({ tournament: updatedTournament });
  } catch (error) {
    console.error("Error updating tournament:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// DELETE /api/v1/tournaments/[tournamentId] - Delete tournament
export const DELETE = withAuth(async (req: NextRequest, _user: JWTPayload) => {
  try {
    const tournamentId = new URL(req.url).pathname.split("/").pop()!;
    const success = await deleteTournament(tournamentId);

    if (!success) {
      return NextResponse.json({ error: "Tournament not found or forbidden" }, { status: 404 });
    }

    return NextResponse.json({ message: "Tournament deleted successfully" });
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// PATCH /api/v1/tournaments/[tournamentId] - Update tournament status
export const PATCH = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const tournamentId = new URL(req.url).pathname.split("/").pop()!;
    const { status }: { status: TournamentStatus } = await req.json();

    // Debug logging
    console.log("PATCH /api/v1/tournaments/[tournamentId] - Received status:", status);
    console.log("Tournament ID:", tournamentId);
    console.log("User ID:", user.userId);

    if (!status || !["draft", "registration", "ongoing", "completed", "cancelled"].includes(status)) {
      console.error("Invalid status received:", status);
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedTournament = await updateTournamentStatus(tournamentId, status);

    // Debug logging
    console.log("Updated tournament status result:", updatedTournament?.status);

    if (!updatedTournament) {
      return NextResponse.json({ error: "Tournament not found or forbidden" }, { status: 404 });
    }

    return NextResponse.json({ tournament: updatedTournament });
  } catch (error) {
    console.error("Error updating tournament status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
