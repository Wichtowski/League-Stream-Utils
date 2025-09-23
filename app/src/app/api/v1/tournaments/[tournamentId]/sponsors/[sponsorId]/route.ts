import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getTournament, updateTournamentFields } from "@/libTournament/database/tournament";
import type { Sponsorship } from "@lib/types";

// Utility function to extract IDs from URL
const extractIds = (req: NextRequest): { tournamentId: string; sponsorId: string } => {
  const pathParts = req.nextUrl.pathname.split("/");
  return {
    tournamentId: pathParts[4],
    sponsorId: pathParts[6]
  };
};

// PUT /api/v1/tournaments/[tournamentId]/sponsors/[sponsorId] - Update sponsor
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const { tournamentId, sponsorId } = extractIds(req);

    if (!tournamentId || !sponsorId) {
      return NextResponse.json({ error: "Tournament ID and Sponsor ID are required" }, { status: 400 });
    }

    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Check if user has access to this tournament
    if (tournament.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updateData: Partial<Sponsorship> = await req.json();

    // Find and update the sponsor
    const currentSponsors = tournament.sponsors || [];
    const sponsorIndex = currentSponsors.findIndex((sponsor) => sponsor._id === sponsorId);

    if (sponsorIndex === -1) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const updatedSponsors = [...currentSponsors];
    updatedSponsors[sponsorIndex] = {
      ...updatedSponsors[sponsorIndex],
      ...updateData
    };

    const result = await updateTournamentFields(tournamentId, {
      sponsors: updatedSponsors
    });

    if (!result?._id) {
      return NextResponse.json({ error: "Failed to update sponsor" }, { status: 500 });
    }

    return NextResponse.json({ sponsor: updatedSponsors[sponsorIndex] });
  } catch (error) {
    console.error("Error updating sponsor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// DELETE /api/v1/tournaments/[tournamentId]/sponsors/[sponsorId] - Delete sponsor
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const { tournamentId, sponsorId } = extractIds(req);

    if (!tournamentId || !sponsorId) {
      return NextResponse.json({ error: "Tournament ID and Sponsor ID are required" }, { status: 400 });
    }

    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Check if user has access to this tournament
    if (tournament.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Remove the sponsor
    const currentSponsors = tournament.sponsors || [];
    const updatedSponsors = currentSponsors.filter((sponsor) => sponsor._id !== sponsorId);

    const result = await updateTournamentFields(tournamentId, {
      sponsors: updatedSponsors
    });

    if (!result?._id) {
      return NextResponse.json({ error: "Failed to delete sponsor" }, { status: 500 });;
    }

    return NextResponse.json({ message: "Sponsor deleted successfully" });
  } catch (error) {
    console.error("Error deleting sponsor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
