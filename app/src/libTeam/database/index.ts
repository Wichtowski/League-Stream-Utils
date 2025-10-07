import { TeamModel } from "@libTeam/database/models";
import { Team, CreateTeamRequest } from "@libTeam/types";
import { Document } from "mongoose";

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
  // compute majority flag from players if possible
  const countries = (teamData.players?.main || [])
    .map((p) => p.country)
    .filter((c): c is string => !!c);
  const countryCounts = countries.reduce<Record<string, number>>((acc, c) => {
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const majorityEntry = Object.entries(countryCounts).find(([, count]) => count >= 3);
  const computedMajorityFlag = majorityEntry?.[0];

  const newTeam = new TeamModel({
    name: teamData.name,
    tag: teamData.tag,
    logo: teamData.logo,
    flag: teamData.flag,
    majorityFlag: computedMajorityFlag,
    colors: teamData.colors,
    players: teamData.players,
    staff: teamData.staff,
    region: teamData.region,
    tier: teamData.tier,
    founded: new Date(),

    socialMedia: teamData.socialMedia,
    collaborators: teamData.collaborators,
    teamOwnerId: userId,
    isStandalone: teamData.isStandalone || false,
    tournamentId: teamData.tournamentId
  });

  await newTeam.save();
  return convertMongoDoc(newTeam);
};

export const getUserTeams = async (teamOwnerId: string): Promise<Team[]> => {
  try {
    const teams = await TeamModel.find({ teamOwnerId }).sort({ createdAt: -1 });

    const convertedTeams = teams.map(convertMongoDoc);

    return convertedTeams;
  } catch (error) {
    console.error("Error in getUserTeams:", error);
    throw error;
  }
};

export const getAllTeams = async (): Promise<Team[]> => {
  const teams = await TeamModel.find({}).sort({ createdAt: -1 });

  const convertedTeams = teams.map(convertMongoDoc);

  return convertedTeams;
};

export const getTeamById = async (teamId: string): Promise<Team | null> => {
  const team = await TeamModel.findById(teamId);
  if (!team) return null;
  return convertMongoDoc(team);
};

export const getTeamLogoByTeamId = async (
  teamId: string
): Promise<{ type: "url"; url: string } | { type: "upload"; data: string } | null> => {
  try {
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
  const team = await TeamModel.findById(teamId);
  if (!team || team.teamOwnerId !== userId) {
    return null;
  }

  if (updates.name) team.name = updates.name;
  if (updates.tag) team.tag = updates.tag;
  if (updates.logo) team.logo = updates.logo as unknown as typeof team.logo;
  if (typeof updates.flag !== "undefined") team.flag = updates.flag;
  if (updates.colors) team.colors = updates.colors;
  if (updates.region) team.region = updates.region;
  if (updates.tier) team.tier = updates.tier;
  if (updates.socialMedia) team.socialMedia = updates.socialMedia;
  if (updates.collaborators) team.collaborators = updates.collaborators as unknown as typeof team.collaborators;

  if (updates.players) {
    team.players = updates.players as unknown as typeof team.players;
    // recompute majority flag if player countries changed
    const countries = (team.players?.main || [])
      .map((p: { country?: string }) => p.country)
      .filter((c: string | undefined): c is string => !!c);
    const countryCounts = countries.reduce<Record<string, number>>((acc, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    const majorityEntry = Object.entries(countryCounts).find(([, count]) => count >= 3);
    team.majorityFlag = majorityEntry?.[0];
  }

  if (updates.staff) {
    team.staff = updates.staff as unknown as typeof team.staff;
  }

  team.updatedAt = new Date();
  await team.save();
  return convertMongoDoc(team);
};

export const deleteTeam = async (teamId: string, userId: string): Promise<boolean> => {
  const team = await TeamModel.findById(teamId);
  if (!team || team.teamOwnerId !== userId) {
    return false;
  }
  const result = await TeamModel.findByIdAndDelete(teamId);
  return !!result;
};

export const getTeamsByIds = async (teamIds: string[]): Promise<Team[]> => {
  const teams = await TeamModel.find({ _id: { $in: teamIds } });
  return teams.map(convertMongoDoc);
};

export const checkTeamAvailability = async (
  name: string,
  tag: string,
  excludeTeamId?: string
): Promise<{ nameAvailable: boolean; tagAvailable: boolean }> => {
  const query = excludeTeamId ? { _id: { $ne: excludeTeamId } } : {};

  const nameExists = await TeamModel.findOne({ ...query, name });

  return {
    nameAvailable: !nameExists,
    tagAvailable: true
  };
};

export const searchTeams = async (query: string, limit: number = 20): Promise<Team[]> => {
  const searchRegex = new RegExp(query, "i");
  const teams = await TeamModel.find({
    $or: [{ name: searchRegex }, { tag: searchRegex }]
  })
    .sort({ createdAt: -1 })
    .limit(limit);
  return teams.map(convertMongoDoc);
};
