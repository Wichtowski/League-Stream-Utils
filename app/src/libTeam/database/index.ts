import { connectToDatabase } from "@lib/database";
import { TeamModel } from "@libTeam/database/models";
import type { Team, CreateTeamRequest } from "@lib/types";
import type { Document } from "mongoose";

const convertMongoDoc = (doc: Document): Team => {
  const obj = doc.toObject();

  // Convert player _id fields to strings
  const convertPlayerIds = (players: Array<Record<string, unknown>>) => {
    return players.map((player) => ({
      ...player,
      _id: (player._id as { toString?: () => string })?.toString?.() || player._id
    }));
  };

  return {
    ...obj,
    _id: obj._id.toString(),
    players: {
      main: convertPlayerIds(obj.players?.main || []),
      substitutes: convertPlayerIds(obj.players?.substitutes || [])
    },
    createdAt: new Date(obj.createdAt),
    updatedAt: new Date(obj.updatedAt),
    founded: new Date(obj.founded)
  };
};

export const createTeam = async (userId: string, teamData: CreateTeamRequest): Promise<Team> => {
  await connectToDatabase();

  const newTeam = new TeamModel({
    name: teamData.name,
    tag: teamData.tag,
    logo: teamData.logo,
    colors: teamData.colors,
    players: teamData.players,
    staff: teamData.staff,
    region: teamData.region,
    tier: teamData.tier,
    founded: new Date(),

    socialMedia: teamData.socialMedia,
    teamOwnerId: userId,
    isStandalone: teamData.isStandalone || false,
    tournamentId: teamData.tournamentId
  });

  await newTeam.save();
  return convertMongoDoc(newTeam);
};

export const getUserTeams = async (teamOwnerId: string): Promise<Team[]> => {
  try {
    await connectToDatabase();
    console.log("Fetching teams for user:", teamOwnerId);

    const teams = await TeamModel.find({ teamOwnerId }).sort({ createdAt: -1 });
    console.log("Raw teams from database:", teams.length);

    const convertedTeams = teams.map(convertMongoDoc);
    console.log("Converted teams:", convertedTeams.length);

    return convertedTeams;
  } catch (error) {
    console.error("Error in getUserTeams:", error);
    throw error;
  }
};

export const getAllTeams = async (): Promise<Team[]> => {
  await connectToDatabase();
  console.log("getAllTeams: Connected to database");

  const teams = await TeamModel.find({}).sort({ createdAt: -1 });
  console.log("getAllTeams: Raw teams from DB:", teams.length);

  const convertedTeams = teams.map(convertMongoDoc);
  console.log("getAllTeams: Converted teams:", convertedTeams.length);

  return convertedTeams;
};

export const getTeamById = async (teamId: string): Promise<Team | null> => {
  await connectToDatabase();
  const team = await TeamModel.findById(teamId);
  if (!team) return null;
  return convertMongoDoc(team);
};

export const getTeamLogoByTeamId = async (
  teamId: string
): Promise<{ type: "url"; url: string } | { type: "upload"; data: string } | null> => {
  try {
    await connectToDatabase();

    const team = await TeamModel.findOne({ _id: teamId }).select({ logo: 1 }).lean().exec();

    if (!team) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logo = (team as any).logo;

    if (!logo) return null;

    if (logo.url) {
      return { type: "url", url: logo.url };
    }

    if (logo.data) {
      return { type: "upload", data: logo.data };
    }

    return null;
  } catch (_error) {
    return null;
  }
};

export const updateTeam = async (
  teamId: string,
  userId: string,
  updates: Partial<CreateTeamRequest>
): Promise<Team | null> => {
  await connectToDatabase();

  const team = await TeamModel.findById(teamId);
  if (!team || team.teamOwnerId !== userId) {
    return null;
  }

  if (updates.name) team.name = updates.name;
  if (updates.tag) team.tag = updates.tag;
  if (updates.logo) team.logo = updates.logo as unknown as typeof team.logo;
  if (updates.colors) team.colors = updates.colors;
  if (updates.region) team.region = updates.region;
  if (updates.tier) team.tier = updates.tier;
  if (updates.socialMedia) team.socialMedia = updates.socialMedia;

  if (updates.players) {
    team.players = updates.players as unknown as typeof team.players;
  }

  if (updates.staff) {
    team.staff = updates.staff as unknown as typeof team.staff;
  }

  team.updatedAt = new Date();
  await team.save();
  return convertMongoDoc(team);
};

export const deleteTeam = async (teamId: string, userId: string): Promise<boolean> => {
  await connectToDatabase();
  const team = await TeamModel.findById(teamId);
  if (!team || team.teamOwnerId !== userId) {
    return false;
  }
  const result = await TeamModel.findByIdAndDelete(teamId);
  return !!result;
};

export const getTeamsByIds = async (teamIds: string[]): Promise<Team[]> => {
  await connectToDatabase();
  const teams = await TeamModel.find({ _id: { $in: teamIds } });
  return teams.map(convertMongoDoc);
};

export const checkTeamAvailability = async (
  name: string,
  tag: string,
  excludeTeamId?: string
): Promise<{ nameAvailable: boolean; tagAvailable: boolean }> => {
  await connectToDatabase();

  const query = excludeTeamId ? { _id: { $ne: excludeTeamId } } : {};

  const nameExists = await TeamModel.findOne({ ...query, name });

  return {
    nameAvailable: !nameExists,
    tagAvailable: true
  };
};

export const searchTeams = async (query: string, limit: number = 20): Promise<Team[]> => {
  await connectToDatabase();
  const searchRegex = new RegExp(query, "i");
  const teams = await TeamModel.find({
    $or: [{ name: searchRegex }, { tag: searchRegex }]
  })
    .sort({ createdAt: -1 })
    .limit(limit);
  return teams.map(convertMongoDoc);
};
