import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getTournament, updateTournamentFields } from "@libTournament/database/tournament";
import type { EmbeddedTicker, CreateTickerRequest } from "@libTournament/types";
import { validateStreamBannerForm, sanitizeStreamBannerForm } from "@libTournament/utils/ticker/validators";
import { logError } from "@lib/utils/error-handling";

// GET /api/v1/tournaments/[tournamentId]/ticker - Get tournament Ticker
export const GET = withAuth(async (req: NextRequest, user, params: Promise<Record<string, string>>) => {
  try {
    const { tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json(
        {
          error: "Tournament ID is required",
          code: "MISSING_TOURNAMENT_ID"
        },
        { status: 400 }
      );
    }

    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        {
          error: "Tournament not found",
          code: "TOURNAMENT_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Check if user owns the tournament
    if (tournament.userId !== user.userId) {
      return NextResponse.json(
        {
          error: "You do not have permission to access this tournament's ticker",
          code: "UNAUTHORIZED_ACCESS"
        },
        { status: 403 }
      );
    }

    // Return single Ticker or null
    const ticker = tournament.ticker || null;

    return NextResponse.json({ ticker });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      operation: "GET_TICKER",
      tournamentId: (await params) ?? "ERROR",
      userId: user.userId
    });

    return NextResponse.json(
      {
        error: "An internal server error occurred while fetching the ticker",
        code: "INTERNAL_SERVER_ERROR"
      },
      { status: 500 }
    );
  }
});

// POST /api/v1/tournaments/[tournamentId]/ticker - Create or update tournament Ticker
export const POST = withAuth(async (req: NextRequest, user, params: Promise<Record<string, string>>) => {
  try {
    const { tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json(
        {
          error: "Tournament ID is required",
          code: "MISSING_TOURNAMENT_ID"
        },
        { status: 400 }
      );
    }

    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        {
          error: "Tournament not found",
          code: "TOURNAMENT_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Check if user owns the tournament
    if (tournament.userId !== user.userId) {
      return NextResponse.json(
        {
          error: "You do not have permission to modify this tournament's ticker",
          code: "UNAUTHORIZED_ACCESS"
        },
        { status: 403 }
      );
    }

    let tickerData: CreateTickerRequest;

    try {
      tickerData = await req.json();
    } catch (_error) {
      return NextResponse.json(
        {
          error: "Invalid JSON data provided",
          code: "INVALID_JSON"
        },
        { status: 400 }
      );
    }

    // Convert to form data format for validation
    const formData = {
      title: (tickerData.title || "").normalize("NFC"),
      titleBackgroundColor: tickerData.titleBackgroundColor || "#1f2937",
      titleTextColor: tickerData.titleTextColor || "#ffffff",
      carouselItems: (tickerData.carouselItems || []).map((item, index) => ({
        text: (item.text || "").normalize("NFC"),
        backgroundColor: item.backgroundColor || "#1f2937",
        textColor: item.textColor || "#ffffff",
        order: index
      })),
      carouselSpeed: tickerData.carouselSpeed || 50,
      carouselBackgroundColor: tickerData.carouselBackgroundColor || "#1f2937"
    };

    // Validate form data
    const validationErrors = validateStreamBannerForm(formData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Sanitize the data
    const sanitizedData = sanitizeStreamBannerForm(formData);

    // Check if ticker already exists
    const existingTicker = tournament.ticker || null;

    // Create a clean ticker object without _id for embedded document
    const cleanTicker: EmbeddedTicker = {
      title: sanitizedData.title,
      titleBackgroundColor: sanitizedData.titleBackgroundColor,
      titleTextColor: sanitizedData.titleTextColor,
      carouselItems: sanitizedData.carouselItems,
      carouselSpeed: sanitizedData.carouselSpeed,
      carouselBackgroundColor: sanitizedData.carouselBackgroundColor,
      createdAt: existingTicker?.createdAt || new Date(),
      updatedAt: new Date()
    };

    console.log("Updating ticker for tournament:", tournamentId, "with data:", cleanTicker);
    
    const result = await updateTournamentFields(tournamentId, {
      ticker: cleanTicker
    });

    console.log("Update result:", result);

    if (!result) {
      logError(new Error("Database update failed"), {
        operation: "UPDATE_TICKER",
        tournamentId,
        userId: user.userId,
        tickerData: cleanTicker
      });

      return NextResponse.json(
        {
          error: "Failed to save ticker to database",
          code: "DATABASE_UPDATE_FAILED"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ticker: cleanTicker,
        message: existingTicker ? "Ticker updated successfully" : "Ticker created successfully"
      },
      { status: existingTicker ? 200 : 201 }
    );
  } catch (error) {
    console.error("Ticker API error:", error);
    console.error("Error type:", typeof error);
    console.error("Error details:", error);
    
    logError(error instanceof Error ? error : new Error(String(error)), {
      operation: "POST_TICKER",
      tournamentId: (await params) ?? "ERROR",
      userId: user.userId
    });

    return NextResponse.json(
      {
        error: "An internal server error occurred while saving the ticker",
        code: "INTERNAL_SERVER_ERROR"
      },
      { status: 500 }
    );
  }
});

// DELETE /api/v1/tournaments/[tournamentId]/ticker - Delete tournament Ticker
export const DELETE = withAuth(async (req: NextRequest, user, params: Promise<Record<string, string>>) => {
  try {
    const { tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json(
        {
          error: "Tournament ID is required",
          code: "MISSING_TOURNAMENT_ID"
        },
        { status: 400 }
      );
    }

    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        {
          error: "Tournament not found",
          code: "TOURNAMENT_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Check if user owns the tournament
    if (tournament.userId !== user.userId) {
      return NextResponse.json(
        {
          error: "You do not have permission to delete this tournament's ticker",
          code: "UNAUTHORIZED_ACCESS"
        },
        { status: 403 }
      );
    }

    // Check if ticker exists
    if (!tournament.ticker) {
      return NextResponse.json(
        {
          error: "No ticker found to delete",
          code: "TICKER_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Remove Ticker
    const result = await updateTournamentFields(tournamentId, {
      ticker: undefined
    });

    if (result === null) {
      logError(new Error("Database delete failed"), {
        operation: "DELETE_TICKER",
        tournamentId,
        userId: user.userId
      });

      return NextResponse.json(
        {
          error: "Failed to delete ticker from database",
          code: "DATABASE_DELETE_FAILED"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Ticker deleted successfully"
    });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      operation: "DELETE_TICKER",
      tournamentId: (await params) ?? "ERROR",
      userId: user.userId
    });

    return NextResponse.json(
      {
        error: "An internal server error occurred while deleting the ticker",
        code: "INTERNAL_SERVER_ERROR"
      },
      { status: 500 }
    );
  }
});
