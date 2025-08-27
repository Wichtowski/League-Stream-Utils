import { connectToDatabase } from "./connection";
import { TeamModel } from "./models";
import type { Team, CreateTeamRequest, RiotPlayerData } from "@lib/types";
import type { Document } from "mongoose";

const convertMongoDoc = (doc: Document): Team => {
  const obj = doc.toObject();
  return {
    ...obj,
    _id: obj._id.toString(),
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
    verified: false,
    socialMedia: teamData.socialMedia,
    teamOwnerId: userId,
    isStandalone: teamData.isStandalone || false,
    tournamentId: teamData.tournamentId
  });

  await newTeam.save();
  return convertMongoDoc(newTeam);
};

export const getUserTeams = async (teamOwnerId: string): Promise<Team[]> => {
  await connectToDatabase();
  const teams = await TeamModel.find({ teamOwnerId }).sort({ createdAt: -1 });
  return teams.map(convertMongoDoc);
};

export const getAllTeams = async (): Promise<Team[]> => {
  await connectToDatabase();
  const teams = await TeamModel.find({}).sort({ createdAt: -1 });
  return teams.map(convertMongoDoc);
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
  await connectToDatabase();
  const team = await TeamModel.findOne({ id: teamId }).select({ logo: 1 }).lean().exec();
  if (!team) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logo = (team as any).logo;
  if (!logo) return null;
  if (logo.url) return { type: "url", url: logo.url };
  if (logo.data) return { type: "upload", data: logo.data };
  return null;
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

export const updateTeamVerification = async (teamId: string, userId: string, verified: boolean): Promise<Team | null> => {
  await connectToDatabase();

  const team = await TeamModel.findById(teamId);
  if (!team || team.teamOwnerId !== userId) {
    return null;
  }

  team.verified = verified;
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

export const verifyTeamPlayers = async (
  teamId: string,
  playerUpdates: {
    playerId: string;
    verified: boolean;
    riotData?: RiotPlayerData;
  }[]
): Promise<Team | null> => {
  await connectToDatabase();

  const team = await TeamModel.findById(teamId);
  if (!team) return null;

  playerUpdates.forEach((update) => {
    const mainPlayer = team.players?.main?.find((p) => p._id?.toString() === update.playerId);
    if (mainPlayer) {
      mainPlayer.verified = update.verified;
      if (update.verified) {
        mainPlayer.verifiedAt = new Date();
      }
      if (update.riotData) {
        mainPlayer.puuid = update.riotData.puuid;
        mainPlayer.summonerLevel = update.riotData.summonerLevel;
        mainPlayer.rank = update.riotData.rank;
        mainPlayer.lastGameAt = new Date();
      }
    }

    const subPlayer = team.players?.substitutes?.find((p) => p._id?.toString() === update.playerId);
    if (subPlayer) {
      subPlayer.verified = update.verified;
      if (update.verified) {
        subPlayer.verifiedAt = new Date();
      }
      if (update.riotData) {
        subPlayer.puuid = update.riotData.puuid;
        subPlayer.summonerLevel = update.riotData.summonerLevel;
        subPlayer.rank = update.riotData.rank;
        subPlayer.lastGameAt = new Date();
      }
    }
  });

  const allMainVerified = (team.players?.main?.length || 0) > 0 && team.players?.main?.every((p) => p.verified);
  const allSubsVerified =
    (team.players?.substitutes?.length || 0) === 0 || team.players?.substitutes?.every((p) => p.verified);
  if (allMainVerified && allSubsVerified) {
    team.verified = true;
  } else {
    team.verified = false;
  }

  team.updatedAt = new Date();
  await team.save();
  return convertMongoDoc(team);
};

export const updatePlayerVerification = async (
  teamId: string,
  userId: string,
  playerId: string,
  verified: boolean
): Promise<Team | null> => {
  await connectToDatabase();

  const team = await TeamModel.findById(teamId);
  if (!team || team.teamOwnerId !== userId) {
    return null;
  }

  team.players?.main?.forEach((player, index: number) => {
    if (player._id?.toString() === playerId) {
      team.players!.main[index] = {
        ...player,
        verified,
        verifiedAt: verified ? new Date() : undefined,
        updatedAt: new Date()
      } as typeof player;
    }
  });

  team.players?.substitutes?.forEach((player, index: number) => {
    if (player._id?.toString() === playerId) {
      team.players!.substitutes[index] = {
        ...player,
        verified,
        verifiedAt: verified ? new Date() : undefined,
        updatedAt: new Date()
      } as typeof player;
    }
  });

  team.updatedAt = new Date();
  await team.save();
  return convertMongoDoc(team);
};

export const verifyAllTeamPlayers = async (teamId: string, userId: string): Promise<Team | null> => {
  await connectToDatabase();

  const team = await TeamModel.findById(teamId);
  if (!team || team.teamOwnerId !== userId) {
    return null;
  }

  const now = new Date();

  team.players?.main?.forEach((player, index: number) => {
    team.players!.main[index] = {
      ...player,
      verified: true,
      verifiedAt: now,
      updatedAt: now
    } as typeof player;
  });

  team.players?.substitutes?.forEach((player, index: number) => {
    team.players!.substitutes[index] = {
      ...player,
      verified: true,
      verifiedAt: now,
      updatedAt: now
    } as typeof player;
  });

  team.updatedAt = now;
  await team.save();
  return convertMongoDoc(team);
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
