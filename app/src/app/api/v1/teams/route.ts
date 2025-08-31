import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { createTeam, getUserTeams, checkTeamAvailability } from "@lib/database/team";
import type { CreateTeamRequest, PlayerRole } from "@lib/types";

// Server-side sanitization functions
const sanitizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, " ");
};

const sanitizeTeamName = (name: string): string => {
  return sanitizeText(name).slice(0, 100);
};

const sanitizeTeamTag = (tag: string): string => {
  return sanitizeText(tag).slice(0, 5).toUpperCase();
};

const sanitizeRegion = (region: string): string => {
  return sanitizeText(region).slice(0, 10).toUpperCase();
};

const sanitizePlayerName = (name: string): string => {
  return sanitizeText(name).slice(0, 50);
};

const sanitizePlayerTag = (tag: string): string => {
  return sanitizeText(tag).slice(0, 20);
};

const sanitizeTeamData = (teamData: CreateTeamRequest): CreateTeamRequest => {
  return {
    ...teamData,
    name: sanitizeTeamName(teamData.name || ""),
    tag: sanitizeTeamTag(teamData.tag || ""),
    region: sanitizeRegion(teamData.region || ""),
    players: {
      main: (teamData.players?.main || []).map((player) => ({
        ...player,
        inGameName: sanitizePlayerName(player.inGameName || ""),
        tag: sanitizePlayerTag(player.tag || "")
      })),
      substitutes: (teamData.players?.substitutes || []).map((player) => ({
        ...player,
        inGameName: sanitizePlayerName(player.inGameName || ""),
        tag: sanitizePlayerTag(player.tag || "")
      }))
    }
  };
};

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const teams = await getUserTeams(user.userId);

    return NextResponse.json({ teams });
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const teamData: CreateTeamRequest = await req.json();

    // Sanitize the team data before processing
    const sanitizedTeamData = sanitizeTeamData(teamData);

    if (!sanitizedTeamData.name || !sanitizedTeamData.tag || !sanitizedTeamData.players?.main?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (sanitizedTeamData.players.main.length !== 5) {
      return NextResponse.json({ error: "Main roster must have exactly 5 players" }, { status: 400 });
    }

    const roles = sanitizedTeamData.players.main.map((p) => p.role);
    const requiredRoles: PlayerRole[] = ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"];
    const hasAllRoles = requiredRoles.every((role) => roles.includes(role));
    const hasUniqueRoles = new Set(roles).size === roles.length;

    if (!hasAllRoles || !hasUniqueRoles) {
      return NextResponse.json(
        {
          error: "Team must have exactly one player per role: TOP, JUNGLE, MID, BOTTOM, SUPPORT"
        },
        { status: 400 }
      );
    }

    const availability = await checkTeamAvailability(sanitizedTeamData.name, sanitizedTeamData.tag);
    if (!availability.nameAvailable) {
      return NextResponse.json({ error: "Team name is already taken" }, { status: 409 });
    }
    // Team tags are not unique - multiple teams can have the same tag

    const team = await createTeam(user.userId, sanitizedTeamData);
    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
