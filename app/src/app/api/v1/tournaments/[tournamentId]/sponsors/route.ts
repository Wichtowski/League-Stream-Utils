import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getTournament, updateTournamentFields } from "@libTournament/database/tournament";
import type { Sponsorship } from "@libTournament/types";
import { Types } from "mongoose";

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

    const sponsorData: Omit<Sponsorship, "_id"> = await req.json();

    // Validate required fields
    if (!sponsorData.name || !sponsorData.logo || !sponsorData.tier) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate unique ID for the sponsor
    const sponsorId = new Types.ObjectId().toString();

    const newSponsor: Sponsorship = {
      _id: sponsorId,
      name: sponsorData.name,
      logo: sponsorData.logo,
      website: sponsorData.website,
      tier: sponsorData.tier,
      startDate: sponsorData.startDate,
      endDate: sponsorData.endDate,
      isActive: sponsorData.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add sponsor to tournament
    const currentSponsors = tournament.sponsors || [];
    const updatedSponsors = [...currentSponsors, newSponsor];

    const result = await updateTournamentFields(tournamentId, {
      sponsors: updatedSponsors
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to add sponsor" }, { status: 500 });
    }

    return NextResponse.json({ sponsor: newSponsor }, { status: 201 });
  } catch (error) {
    console.error("Error adding sponsor to tournament:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
