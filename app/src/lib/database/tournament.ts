import { v4 as uuidv4 } from "uuid";
import { connectToDatabase } from "./connection";
import { TournamentModel } from "./models";
import type {
  Tournament as TournamentType,
  CreateTournamentRequest,
} from "@lib/types";

export async function createTournament(
  userId: string,
  tournamentData: CreateTournamentRequest,
): Promise<TournamentType> {
  await connectToDatabase();

  const tournamentDoc: TournamentType = {
    id: uuidv4(),
    name: tournamentData.name,
    abbreviation: tournamentData.abbreviation,
    startDate: new Date(tournamentData.startDate),
    endDate: new Date(tournamentData.endDate),
    requireRegistrationDeadline: tournamentData.requireRegistrationDeadline,
    matchFormat: tournamentData.matchFormat,
    tournamentFormat: tournamentData.tournamentFormat,
    phaseMatchFormats: tournamentData.phaseMatchFormats,
    maxTeams: tournamentData.maxTeams,
    registrationOpen: true,
    prizePool: tournamentData.prizePool,
    fearlessDraft: tournamentData.fearlessDraft,
    logo: tournamentData.logo,
    registeredTeams: [],
    selectedTeams: tournamentData.selectedTeams || [],
    status: "draft",
    allowSubstitutes: true,
    maxSubstitutes: 2,
    timezone: tournamentData.timezone,
    matchDays: tournamentData.matchDays || [],
    defaultMatchTime: tournamentData.defaultMatchTime,
    streamUrl: tournamentData.streamUrl,
    broadcastLanguage: tournamentData.broadcastLanguage,
    sponsors: tournamentData.sponsors || [],
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (
    tournamentData.requireRegistrationDeadline &&
    tournamentData.registrationDeadline
  ) {
    tournamentDoc.registrationDeadline = new Date(
      tournamentData.registrationDeadline,
    );
  }

  const newTournament = new TournamentModel(tournamentDoc);

  await newTournament.save();
  return newTournament.toObject();
}

export async function getUserTournaments(
  userId: string,
): Promise<TournamentType[]> {
  await connectToDatabase();
  const tournaments = await TournamentModel.find({ userId }).sort({
    createdAt: -1,
  });
  return tournaments.map((tournament) => tournament.toObject());
}

export async function getAllTournaments(): Promise<TournamentType[]> {
  await connectToDatabase();
  const tournaments = await TournamentModel.find({}).sort({ createdAt: -1 });
  return tournaments.map((tournament) => tournament.toObject());
}

export async function getTournamentById(
  tournamentId: string,
): Promise<TournamentType | null> {
  await connectToDatabase();
  const tournament = await TournamentModel.findOne({ id: tournamentId });
  return tournament ? tournament.toObject() : null;
}

export async function updateTournament(
  tournamentId: string,
  userId: string,
  updates: Partial<CreateTournamentRequest>,
): Promise<TournamentType | null> {
  await connectToDatabase();

  const tournament = await TournamentModel.findOne({
    id: tournamentId,
    userId,
  });
  if (!tournament) {
    return null;
  }

  if (updates.name) tournament.name = updates.name;
  if (updates.abbreviation) tournament.abbreviation = updates.abbreviation;
  if (updates.startDate) tournament.startDate = new Date(updates.startDate);
  if (updates.endDate) tournament.endDate = new Date(updates.endDate);
  if (updates.requireRegistrationDeadline !== undefined)
    tournament.requireRegistrationDeadline =
      updates.requireRegistrationDeadline;
  if (updates.registrationDeadline)
    tournament.registrationDeadline = new Date(updates.registrationDeadline);
  if (updates.matchFormat) tournament.matchFormat = updates.matchFormat;
  if (updates.tournamentFormat)
    tournament.tournamentFormat = updates.tournamentFormat;
  if (updates.maxTeams) tournament.maxTeams = updates.maxTeams;
  if (updates.prizePool !== undefined) tournament.prizePool = updates.prizePool;
  if (updates.fearlessDraft !== undefined)
    tournament.fearlessDraft = updates.fearlessDraft;
  if (updates.logo) tournament.logo = updates.logo;
  if (updates.selectedTeams) tournament.selectedTeams = updates.selectedTeams;
  if (updates.timezone) tournament.timezone = updates.timezone;
  if (updates.matchDays) tournament.matchDays = updates.matchDays;
  if (updates.defaultMatchTime)
    tournament.defaultMatchTime = updates.defaultMatchTime;
  if (updates.streamUrl !== undefined) tournament.streamUrl = updates.streamUrl;
  if (updates.broadcastLanguage !== undefined)
    tournament.broadcastLanguage = updates.broadcastLanguage;

  tournament.updatedAt = new Date();
  await tournament.save();
  return tournament.toObject();
}

export async function deleteTournament(
  tournamentId: string,
  userId: string,
): Promise<boolean> {
  await connectToDatabase();
  const result = await TournamentModel.deleteOne({ id: tournamentId, userId });
  return result.deletedCount > 0;
}

export async function updateTournamentStatus(
  tournamentId: string,
  userId: string,
  status: TournamentType["status"],
): Promise<TournamentType | null> {
  await connectToDatabase();

  const tournament = await TournamentModel.findOne({
    id: tournamentId,
    userId,
  });
  if (!tournament) {
    return null;
  }

  tournament.status = status;
  tournament.updatedAt = new Date();
  await tournament.save();
  return tournament.toObject();
}

export async function registerTeamForTournament(
  tournamentId: string,
  teamId: string,
  isAdmin: boolean = false,
): Promise<TournamentType | null> {
  await connectToDatabase();

  const tournament = await TournamentModel.findOne({ id: tournamentId });
  if (!tournament) {
    return null;
  }

  if (!isAdmin) {
    if (!tournament.registrationOpen || tournament.status !== "registration") {
      return null;
    }

    if (tournament.registeredTeams.length >= tournament.maxTeams) {
      return null;
    }
  }

  if (tournament.registeredTeams.includes(teamId)) {
    return tournament.toObject();
  }

  tournament.registeredTeams.push(teamId);
  tournament.updatedAt = new Date();
  await tournament.save();
  return tournament.toObject();
}

export async function unregisterTeamFromTournament(
  tournamentId: string,
  teamId: string,
): Promise<TournamentType | null> {
  await connectToDatabase();

  const tournament = await TournamentModel.findOne({ id: tournamentId });
  if (!tournament) {
    return null;
  }

  tournament.registeredTeams = tournament.registeredTeams.filter(
    (id: string) => id !== teamId,
  );
  tournament.updatedAt = new Date();
  await tournament.save();
  return tournament.toObject();
}

export async function getPublicTournaments(
  limit: number = 20,
  offset: number = 0,
): Promise<TournamentType[]> {
  await connectToDatabase();
  const tournaments = await TournamentModel.find({
    status: { $in: ["registration", "ongoing"] },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);

  return tournaments.map((tournament) => tournament.toObject());
}

export async function searchTournaments(
  query: string,
  limit: number = 20,
): Promise<TournamentType[]> {
  await connectToDatabase();

  const searchRegex = new RegExp(query, "i");
  const tournaments = await TournamentModel.find({
    $or: [{ name: searchRegex }, { abbreviation: searchRegex }],
    status: { $in: ["registration", "ongoing"] },
  })
    .sort({ createdAt: -1 })
    .limit(limit);

  return tournaments.map((tournament) => tournament.toObject());
}

export async function getTournamentStats(tournamentId: string): Promise<{
  registeredTeams: number;
  maxTeams: number;
  daysUntilStart: number;
  daysUntilRegistrationDeadline: number | null;
} | null> {
  await connectToDatabase();

  const tournament = await TournamentModel.findOne({ id: tournamentId });
  if (!tournament) {
    return null;
  }

  const now = new Date();
  const daysUntilStart = Math.ceil(
    (tournament.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysUntilRegistrationDeadline =
    tournament.requireRegistrationDeadline && tournament.registrationDeadline
      ? Math.ceil(
          (tournament.registrationDeadline.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

  return {
    registeredTeams: tournament.registeredTeams.length,
    maxTeams: tournament.maxTeams,
    daysUntilStart,
    daysUntilRegistrationDeadline,
  };
}

export async function checkTournamentAvailability(
  name: string,
  abbreviation: string,
  excludeTournamentId?: string,
): Promise<{ nameAvailable: boolean; abbreviationAvailable: boolean }> {
  await connectToDatabase();

  const query = excludeTournamentId ? { id: { $ne: excludeTournamentId } } : {};

  const [nameExists, abbreviationExists] = await Promise.all([
    TournamentModel.findOne({ ...query, name }),
    TournamentModel.findOne({ ...query, abbreviation }),
  ]);

  return {
    nameAvailable: !nameExists,
    abbreviationAvailable: !abbreviationExists,
  };
}

export async function getTournament(
  tournamentId: string,
): Promise<TournamentType | null> {
  await connectToDatabase();
  const tournament = await TournamentModel.findOne({ id: tournamentId });
  return tournament ? tournament.toObject() : null;
}

export async function updateTournamentFields(
  tournamentId: string,
  updates: Partial<TournamentType>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();

    const tournament = await TournamentModel.findOne({ id: tournamentId });
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    // Update all provided fields
    Object.assign(tournament, updates);
    tournament.updatedAt = new Date();

    await tournament.save();
    return { success: true };
  } catch (error) {
    console.error("Error updating tournament:", error);
    return { success: false, error: "Failed to update tournament" };
  }
}
