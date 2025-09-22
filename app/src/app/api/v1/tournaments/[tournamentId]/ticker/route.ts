import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getTournament, updateTournamentFields } from "@/libTournament/database/tournament";
import type { EmbeddedTicker, CreateTickerRequest } from "@libTournament/types/ticker";

// Utility function to extract tournament ID from URL
const extractTournamentId = (req: NextRequest): string => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    return pathSegments[pathSegments.indexOf("tournaments") + 1];
};

// GET /api/v1/tournaments/[tournamentId]/ticker - Get tournament Ticker
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

        // Return single Ticker or null
        let Ticker = tournament.ticker
            ? tournament.ticker
            : null;

        // Ensure backward compatibility for existing tickers
        if (Ticker) {
            Ticker = {
                ...Ticker,
                titleBackgroundColor: Ticker.titleBackgroundColor || "#1f2937",
                titleTextColor: Ticker.titleTextColor || "#ffffff",
                carouselBackgroundColor: Ticker.carouselBackgroundColor || "#1f2937"
            };
        }

        return NextResponse.json({ Ticker });
    } catch (error) {
        console.error("Error fetching tournament Ticker:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
});

// POST /api/v1/tournaments/[tournamentId]/ticker - Create or update tournament Ticker
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

        const tickerData: CreateTickerRequest = await req.json();

        // Validate required fields
        if (!tickerData.title || tickerData.title.trim() === "") {
            return NextResponse.json({ error: "Ticker title is required" }, { status: 400 });
        }

        // Check if ticker already exists
        const existingTicker = tournament.ticker
            ? tournament.ticker
            : null;



        // Create a clean ticker object without _id for embedded document
        const cleanTicker: EmbeddedTicker = {
            title: tickerData.title,
            titleBackgroundColor: tickerData.titleBackgroundColor || "#1f2937",
            titleTextColor: tickerData.titleTextColor || "#ffffff",
            carouselItems: tickerData.carouselItems || [],
            carouselSpeed: tickerData.carouselSpeed || 50,
            carouselBackgroundColor: tickerData.carouselBackgroundColor || "#1f2937",
            createdAt: existingTicker?.createdAt || new Date(),
            updatedAt: new Date()
        };

        // Use the existing updateTournr object:", JSON.stringify(cleanTicker, null, 2));

        // Use the existing updateTournamentFields function (no need for extra DB connection)
        console.log("Updating tournament using existing function...");
        console.log("Tournament ID:", tournamentId);
        console.log("Update payload:", JSON.stringify({ Ticker: cleanTicker }, null, 2));

        const result = await updateTournamentFields(tournamentId, {
            ticker: cleanTicker
        });

        console.log("Update result:", result ? "Success" : "Failed");

        if (result) {
            console.log("Updated tournament Ticker field:", JSON.stringify(result.ticker, null, 2));
        } else {
            console.log("No result returned from updateTournamentFields");
        }

        if (!result) {
            console.log("Update failed - no result returned");
            return NextResponse.json({ error: "Failed to save Ticker" }, { status: 500 });
        }

        return NextResponse.json({
            Ticker: cleanTicker,
            message: existingTicker ? "Ticker updated successfully" : "Ticker created successfully"
        }, { status: existingTicker ? 200 : 201 });
    } catch (error) {
        console.error("Error saving Ticker:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
});

// DELETE /api/v1/tournaments/[tournamentId]/ticker - Delete tournament Ticker
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

        // Remove Ticker
        const result = await updateTournamentFields(tournamentId, {
            ticker: undefined
        });

        if (result === null) {
            return NextResponse.json({ error: "Failed to delete Ticker" }, { status: 500 });
        }

        return NextResponse.json({ message: "Ticker deleted successfully" });
    } catch (error) {
        console.error("Error deleting Ticker:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
});