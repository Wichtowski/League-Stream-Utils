import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getTournament, updateTournamentFields } from "@/libTournament/database/tournament";
import type { StreamBanner, UpdateStreamBannerRequest } from "@lib/types/tournament";

// Utility function to extract IDs from URL
const extractIds = (req: NextRequest): { tournamentId: string; bannerId: string } => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const tournamentIndex = pathSegments.indexOf("tournaments");
    return {
        tournamentId: pathSegments[tournamentIndex + 1],
        bannerId: pathSegments[pathSegments.length - 1]
    };
};

// PUT /api/v1/tournaments/[tournamentId]/stream-banners/[bannerId] - Update stream banner
export const PUT = withAuth(async (req: NextRequest, user) => {
    try {
        const { tournamentId, bannerId } = extractIds(req);

        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        // Check if user owns the tournament
        if (tournament.userId !== user.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const updateData: Partial<StreamBanner> = await req.json();

        // Find and update the banner
        const currentBanners = tournament.streamBanners || [];
        const bannerIndex = currentBanners.findIndex((banner) => banner._id === bannerId);

        if (bannerIndex === -1) {
            return NextResponse.json({ error: "Stream banner not found" }, { status: 404 });
        }

        const updatedBanners = [...currentBanners];
        updatedBanners[bannerIndex] = {
            ...updatedBanners[bannerIndex],
            ...updateData,
            updatedAt: new Date()
        };

        const result = await updateTournamentFields(tournamentId, {
            streamBanners: updatedBanners
        });

        if (!result?.streamBanners) {
            return NextResponse.json({ error: "Failed to update stream banner" }, { status: 500 });
        }

        return NextResponse.json({ streamBanner: updatedBanners[bannerIndex] });
    } catch (error) {
        console.error("Error updating stream banner:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
});

// DELETE /api/v1/tournaments/[tournamentId]/stream-banners/[bannerId] - Delete stream banner
export const DELETE = withAuth(async (req: NextRequest, user) => {
    try {
        const { tournamentId, bannerId } = extractIds(req);

        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        // Check if user owns the tournament
        if (tournament.userId !== user.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Check if banner exists
        const currentBanners = tournament.streamBanners || [];
        const bannerExists = currentBanners.some((banner) => banner._id === bannerId);

        if (!bannerExists) {
            return NextResponse.json({ error: "Stream banner not found" }, { status: 404 });
        }

        // Remove the banner
        const updatedBanners = currentBanners.filter((banner) => banner._id !== bannerId);

        const result = await updateTournamentFields(tournamentId, {
            streamBanners: updatedBanners
        });

        if (!result?.streamBanners) {
            return NextResponse.json({ error: "Failed to delete stream banner" }, { status: 500 });
        }

        return NextResponse.json({ message: "Stream banner deleted successfully" });
    } catch (error) {
        console.error("Error deleting stream banner:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
});