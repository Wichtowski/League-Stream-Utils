import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getTournament, updateTournamentFields } from "@/libTournament/database/tournament";
import type { EmbeddedStreamBanner, CreateStreamBannerRequest } from "@lib/types/tournament";

// Utility function to extract tournament ID from URL
const extractTournamentId = (req: NextRequest): string => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    return pathSegments[pathSegments.indexOf("tournaments") + 1];
};

// GET /api/v1/tournaments/[tournamentId]/stream-banners - Get tournament stream banner
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

        // Return single stream banner or null
        let streamBanner = tournament.streamBanner
            ? tournament.streamBanner
            : null;

        // Ensure backward compatibility for existing banners
        if (streamBanner) {
            streamBanner = {
                ...streamBanner,
                titleBackgroundColor: streamBanner.titleBackgroundColor || "#1f2937",
                titleTextColor: streamBanner.titleTextColor || "#ffffff",
                carouselBackgroundColor: streamBanner.carouselBackgroundColor || "#1f2937"
            };
        }

        return NextResponse.json({ streamBanner });
    } catch (error) {
        console.error("Error fetching tournament stream banner:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
});

// POST /api/v1/tournaments/[tournamentId]/stream-banners - Create or update tournament stream banner
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

        // Check if banner already exists
        const existingBanner = tournament.streamBanner
            ? tournament.streamBanner
            : null;



        // Create a clean banner object without _id for embedded document
        const cleanStreamBanner: EmbeddedStreamBanner = {
            title: bannerData.title,
            titleBackgroundColor: bannerData.titleBackgroundColor || "#1f2937",
            titleTextColor: bannerData.titleTextColor || "#ffffff",
            carouselItems: bannerData.carouselItems || [],
            carouselSpeed: bannerData.carouselSpeed || 50,
            carouselBackgroundColor: bannerData.carouselBackgroundColor || "#1f2937",
            createdAt: existingBanner?.createdAt || new Date(),
            updatedAt: new Date()
        };

        // Use the existing updateTournr object:", JSON.stringify(cleanStreamBanner, null, 2));

        // Use the existing updateTournamentFields function (no need for extra DB connection)
        console.log("Updating tournament using existing function...");
        console.log("Tournament ID:", tournamentId);
        console.log("Update payload:", JSON.stringify({ streamBanner: cleanStreamBanner }, null, 2));

        const result = await updateTournamentFields(tournamentId, {
            streamBanner: cleanStreamBanner
        });

        console.log("Update result:", result ? "Success" : "Failed");

        if (result) {
            console.log("Updated tournament streamBanner field:", JSON.stringify(result.streamBanner, null, 2));
        } else {
            console.log("No result returned from updateTournamentFields");
        }

        if (!result) {
            console.log("Update failed - no result returned");
            return NextResponse.json({ error: "Failed to save stream banner" }, { status: 500 });
        }

        return NextResponse.json({
            streamBanner: cleanStreamBanner,
            message: existingBanner ? "Stream banner updated successfully" : "Stream banner created successfully"
        }, { status: existingBanner ? 200 : 201 });
    } catch (error) {
        console.error("Error saving stream banner:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
});

// DELETE /api/v1/tournaments/[tournamentId]/stream-banners - Delete tournament stream banner
export const DELETE = withAuth(async (req: NextRequest, user) => {
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

        // Remove stream banner
        const result = await updateTournamentFields(tournamentId, {
            streamBanner: undefined
        });

        if (result === null) {
            return NextResponse.json({ error: "Failed to delete stream banner" }, { status: 500 });
        }

        return NextResponse.json({ message: "Stream banner deleted successfully" });
    } catch (error) {
        console.error("Error deleting stream banner:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
});