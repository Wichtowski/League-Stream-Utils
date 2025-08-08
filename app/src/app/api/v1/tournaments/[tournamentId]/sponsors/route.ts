import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getTournament, updateTournamentFields } from "@lib/database/tournament";
import type { Sponsorship } from "@lib/types";

// Utility function to extract tournament ID from URL
const extractTournamentId = (req: NextRequest): string => {
  return req.nextUrl.pathname.split("/")[4];
};

// GET /api/v1/tournaments/[tournamentId]/sponsors - Get tournament sponsors
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const tournamentId = extractTournamentId(req);

    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
    }

    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Check if user has access to this tournament
    if (tournament.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ sponsors: tournament.sponsors || [] });
  } catch (error) {
    console.error("Error fetching tournament sponsors:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// POST /api/v1/tournaments/[tournamentId]/sponsors - Add sponsor to tournament
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const tournamentId = extractTournamentId(req);

    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
    }

    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Check if user has access to this tournament
    if (tournament.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const sponsorData: Omit<Sponsorship, "id"> = await req.json();

    // Validate required fields
    if (!sponsorData.name || !sponsorData.logo || !sponsorData.tier) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate unique ID for the sponsor
    const sponsorId = `sponsor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newSponsor: Sponsorship = {
      id: sponsorId,
      name: sponsorData.name,
      logo: sponsorData.logo,
      website: sponsorData.website,
      tier: sponsorData.tier,
      displayPriority: sponsorData.displayPriority || 0,
      showName: sponsorData.showName ?? true,
      namePosition: sponsorData.namePosition ?? "right",
      fillContainer: sponsorData.fillContainer ?? false
    };

    // Add sponsor to tournament
    const currentSponsors = tournament.sponsors || [];
    const updatedSponsors = [...currentSponsors, newSponsor];

    const result = await updateTournamentFields(tournamentId, {
      sponsors: updatedSponsors
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to add sponsor" }, { status: 500 });
    }

    return NextResponse.json({ sponsor: newSponsor }, { status: 201 });
  } catch (error) {
    console.error("Error adding sponsor to tournament:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
