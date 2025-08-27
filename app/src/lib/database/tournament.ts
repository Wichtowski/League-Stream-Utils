import { connectToDatabase } from "./connection";
import { TournamentModel } from "./models";
import type { Tournament as TournamentType, CreateTournamentRequest } from "@lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertMongoDoc = (doc: any): TournamentType => {
  const obj = doc.toObject();
  return {
    ...obj,
    _id: obj._id.toString(),
    startDate: new Date(obj.startDate),
    endDate: new Date(obj.endDate),
    registrationDeadline: obj.registrationDeadline ? new Date(obj.registrationDeadline) : undefined,
    createdAt: new Date(obj.createdAt),
    updatedAt: new Date(obj.updatedAt)
  };
};

export const createTournament = async (userId: string, tournamentData: CreateTournamentRequest): Promise<TournamentType> => {
  await connectToDatabase();

  const newTournament = new TournamentModel({
    name: tournamentData.name,
    abbreviation: tournamentData.abbreviation,
    startDate: new Date(tournamentData.startDate),
    endDate: new Date(tournamentData.endDate),
    requireRegistrationDeadline: tournamentData.requireRegistrationDeadline,
    registrationDeadline: tournamentData.registrationDeadline ? new Date(tournamentData.registrationDeadline) : undefined,
    matchFormat: tournamentData.matchFormat,
    tournamentFormat: tournamentData.tournamentFormat,
    phaseMatchFormats: tournamentData.phaseMatchFormats,
    maxTeams: tournamentData.maxTeams,
    prizePool: tournamentData.prizePool,
    fearlessDraft: tournamentData.fearlessDraft,
    logo: tournamentData.logo,
    selectedTeams: tournamentData.selectedTeams,
    timezone: tournamentData.timezone,
    matchDays: tournamentData.matchDays,
    defaultMatchTime: tournamentData.defaultMatchTime,
    streamUrl: tournamentData.streamUrl,
    broadcastLanguage: tournamentData.broadcastLanguage,
    gameVersion: tournamentData.gameVersion,
    sponsors: tournamentData.sponsors,
    userId
  });

  await newTournament.save();
  return convertMongoDoc(newTournament);
};

export async function getUserTournaments(userId: string): Promise<TournamentType[]> {
  await connectToDatabase();
  const tournaments = await TournamentModel.find({ userId }).sort({
    createdAt: -1
  });
  return tournaments.map(convertMongoDoc);
}

export async function getAllTournaments(): Promise<TournamentType[]> {
  await connectToDatabase();
  const tournaments = await TournamentModel.find({}).sort({ createdAt: -1 });
  return tournaments.map(convertMongoDoc);
}

export async function getTournamentById(tournamentId: string): Promise<TournamentType | null> {
  await connectToDatabase();
  const tournament = await TournamentModel.findById(tournamentId);
  if (!tournament) return null;
  return convertMongoDoc(tournament);
}

export const updateTournament = async (
  tournamentId: string,
  updates: Partial<TournamentType>
): Promise<TournamentType | null> => {
  await connectToDatabase();
  const updatedTournament = await TournamentModel.findByIdAndUpdate(tournamentId, updates, { new: true });
  if (!updatedTournament) return null;
  return convertMongoDoc(updatedTournament);
};

export const deleteTournament = async (tournamentId: string): Promise<boolean> => {
  await connectToDatabase();
  const result = await TournamentModel.findByIdAndDelete(tournamentId);
  return !!result;
};

export const registerTeamToTournament = async (tournamentId: string, teamId: string): Promise<TournamentType | null> => {
  await connectToDatabase();
  const tournament = await TournamentModel.findById(tournamentId);
  if (!tournament) return null;

  if (!tournament.registeredTeams.includes(teamId)) {
    tournament.registeredTeams.push(teamId);
    await tournament.save();
  }

  return convertMongoDoc(tournament);
};

// Alias to match API imports
export const registerTeamForTournament = async (
  tournamentId: string,
  teamId: string,
  _bypassConstraints?: boolean
): Promise<TournamentType | null> => {
  return registerTeamToTournament(tournamentId, teamId);
};

export const unregisterTeamFromTournament = async (tournamentId: string, teamId: string): Promise<TournamentType | null> => {
  await connectToDatabase();
  const tournament = await TournamentModel.findById(tournamentId);
  if (!tournament) return null;

  tournament.registeredTeams = tournament.registeredTeams.filter(id => id !== teamId);
  await tournament.save();

  return convertMongoDoc(tournament);
};

export const getPublicTournaments = async (limit: number = 20, offset: number = 0): Promise<TournamentType[]> => {
  await connectToDatabase();
  const tournaments = await TournamentModel.find({
    status: { $in: ["registration", "ongoing"] }
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);

  return tournaments.map(convertMongoDoc);
};

export const searchTournaments = async (query: string, limit: number = 20): Promise<TournamentType[]> => {
  await connectToDatabase();

  const searchRegex = new RegExp(query, "i");
  const tournaments = await TournamentModel.find({
    $or: [{ name: searchRegex }, { abbreviation: searchRegex }],
    status: { $in: ["registration", "ongoing"] }
  })
    .sort({ createdAt: -1 })
    .limit(limit);

  return tournaments.map(convertMongoDoc);
};

export const getTournamentStats = async (tournamentId: string): Promise<{
  totalTeams: number;
  registeredTeams: number;
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
} | null> => {
  await connectToDatabase();
  const tournament = await TournamentModel.findById(tournamentId);
  if (!tournament) return null;

  return {
    totalTeams: tournament.maxTeams,
    registeredTeams: tournament.registeredTeams.length,
    totalMatches: tournament.matches?.length || 0,
    completedMatches: 0, // This would need to be calculated from actual matches
    pendingMatches: 0 // This would need to be calculated from actual matches
  };
};

export const checkTournamentAvailability = async (
  name: string,
  abbreviation: string,
  excludeTournamentId?: string
): Promise<{ nameAvailable: boolean; abbreviationAvailable: boolean }> => {
  await connectToDatabase();

  const query = excludeTournamentId ? { _id: { $ne: excludeTournamentId } } : {};

  const nameExists = await TournamentModel.findOne({ ...query, name });
  const abbreviationExists = await TournamentModel.findOne({ ...query, abbreviation });

  return {
    nameAvailable: !nameExists,
    abbreviationAvailable: !abbreviationExists
  };
};

export const getTournament = async (tournamentId: string): Promise<TournamentType | null> => {
  await connectToDatabase();
  const tournament = await TournamentModel.findById(tournamentId);
  if (!tournament) return null;
  return convertMongoDoc(tournament);
};

export const updateTournamentFields = async (
  tournamentId: string,
  updates: Partial<TournamentType>
): Promise<TournamentType | null> => {
  await connectToDatabase();
  const updatedTournament = await TournamentModel.findByIdAndUpdate(tournamentId, updates, { new: true });
  if (!updatedTournament) return null;
  return convertMongoDoc(updatedTournament);
};

// Minimal status updater to match API imports
export const updateTournamentStatus = async (
  tournamentId: string,
  status: TournamentType["status"]
): Promise<TournamentType | null> => {
  return updateTournamentFields(tournamentId, { status });
};
