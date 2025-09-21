import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getTournament, updateTournamentFields } from "@/libTournament/database/tournament";
import type { StreamBanner, CreateStreamBannerRequest } from "@lib/types/tournament";

// Utility function to extract tournament ID from URL
const extractTournamentId = (req: NextRequest): string => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    return pathSegments[pathSegments.indexOf("tournaments") + 1];
};

// GET /api/v1/tournaments/[tournamentId]/stream-banners - Get tournament stream banners
export const GET = withAuth(async (req: NextRequest, user) => {
    try {
        const tournamentId = extractTournamentId(req);

        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        // Check if user owns the tournament
        if (tournament.userId !== user.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json({ streamBanners: tournament.streamBanners || [] });
    } catch (error) {
        console.error("Error fetching tournament stream banners:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
});

// POST /api/v1/tournaments/[tournamentId]/stream-banners - Add stream banner to tournament
export const POST = withAuth(async (req: NextRequest, user) => {
    try {
        const tournamentId = extractTournamentId(req);

        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        // Check if user owns the tournament
        if (tournament.userId !== user.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const bannerData: CreateStreamBannerRequest = await req.json();

        // Validate required fields
        if (!bannerData.title || bannerData.title.trim() === "") {
            return NextResponse.json({ error: "Banner title is required" }, { status: 400 });
        }

        // Generate unique ID for the banner
        const bannerId = `banner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newBanner: StreamBanner = {
            _id: bannerId,
            title: bannerData.title,
            carouselItems: bannerData.carouselItems || [],
            displayDuration: bannerData.displayDuration || 5,
            carouselSpeed: bannerData.carouselSpeed || 50,
            isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
            priority: bannerData.priority || 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Add banner to tournament
        const currentBanners = tournament.streamBanners || [];
        const updatedBanners = [...currentBanners, newBanner];

        const result = await updateTournamentFields(tournamentId, {
            streamBanners: updatedBanners
        });

        if (!result?.streamBanners) {
            return NextResponse.json({ error: "Failed to add stream banner" }, { status: 500 });
        }

        return NextResponse.json({ streamBanner: newBanner }, { status: 201 });
    } catch (error) {
        console.error("Error adding stream banner:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
});