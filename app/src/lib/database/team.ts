import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from './connection';
import { TeamModel } from './models';
import type { Team, CreateTeamRequest, Player, RiotPlayerData } from '@lib/types';

// Create a new team
export async function createTeam(userId: string, teamData: CreateTeamRequest): Promise<Team> {
    await connectToDatabase();

    // Generate IDs for players and staff
    const mainPlayers: Player[] = teamData.players.main.map((player) => ({
        ...player,
        id: uuidv4(),
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date()
    }));

    const substitutePlayers: Player[] = teamData.players.substitutes.map((player) => ({
        ...player,
        id: uuidv4(),
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date()
    }));

    // Generate IDs for staff
    const staff: Team['staff'] = {};
    if (teamData.staff?.coach) {
        staff.coach = { ...teamData.staff.coach, id: uuidv4() };
    }
    if (teamData.staff?.analyst) {
        staff.analyst = { ...teamData.staff.analyst, id: uuidv4() };
    }
    if (teamData.staff?.manager) {
        staff.manager = { ...teamData.staff.manager, id: uuidv4() };
    }

    const newTeam = new TeamModel({
        id: uuidv4(),
        name: teamData.name,
        tag: teamData.tag,
        logo: teamData.logo,
        colors: teamData.colors,
        players: {
            main: mainPlayers,
            substitutes: substitutePlayers
        },
        staff,
        region: teamData.region,
        tier: teamData.tier,
        founded: new Date(),
        verified: false,
        socialMedia: teamData.socialMedia,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    await newTeam.save();
    return newTeam.toObject();
}

export async function getUserTeams(userId: string): Promise<Team[]> {
    await connectToDatabase();
    const teams = await TeamModel.find({ userId }).sort({ createdAt: -1 });
    return teams.map((team: { toObject: () => Team }) => team.toObject());
}

// Get all teams (admin only)
export async function getAllTeams(): Promise<Team[]> {
    await connectToDatabase();
    const teams = await TeamModel.find({}).sort({ createdAt: -1 });
    return teams.map((team: { toObject: () => Team }) => team.toObject());
}

export async function getTeamById(teamId: string): Promise<Team | null> {
    await connectToDatabase();
    const team = await TeamModel.findOne({ id: teamId });
    return team ? team.toObject() : null;
}

// Update team
export async function updateTeam(
    teamId: string,
    userId: string,
    updates: Partial<CreateTeamRequest>
): Promise<Team | null> {
    await connectToDatabase();

    // Find the team and verify ownership
    const team = await TeamModel.findOne({ id: teamId, userId });
    if (!team) {
        return null;
    }

    // Update fields
    if (updates.name) team.name = updates.name;
    if (updates.tag) team.tag = updates.tag;
    if (updates.logo) team.logo = updates.logo;
    if (updates.colors) team.colors = updates.colors;
    if (updates.region) team.region = updates.region;
    if (updates.tier) team.tier = updates.tier;
    if (updates.socialMedia) team.socialMedia = updates.socialMedia;

    // Helper to compare player lists
    const playersEqual = (a: Player[], b: Player[]): boolean => {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i].inGameName !== b[i].inGameName || a[i].tag !== b[i].tag || a[i].role !== b[i].role) {
                return false;
            }
        }
        return true;
    };

    // Update players if provided
    if (updates.players) {
        const oldMain = team.players.main || [];
        const oldSubs = team.players.substitutes || [];
        const newMain = updates.players.main || [];
        const newSubs = updates.players.substitutes || [];

        const mainChanged = !playersEqual(oldMain as Player[], newMain as Player[]);
        const subsChanged = !playersEqual(oldSubs as Player[], newSubs as Player[]);

        // If roster changed, reset verification
        if (mainChanged || subsChanged) {
            team.verified = false;
            team.players = {
                main: newMain.map((player) => ({
                    ...player,
                    id: uuidv4(),
                    verified: false,
                    verifiedAt: undefined,
                    createdAt: new Date(),
                    updatedAt: new Date()
                })),
                substitutes: newSubs.map((player) => ({
                    ...player,
                    id: uuidv4(),
                    verified: false,
                    verifiedAt: undefined,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }))
            };
        } else {
            // If roster unchanged, keep existing players
            // (no-op, or you could update other fields if needed)
        }
    }

    // Update staff if provided
    if (updates.staff) {
        const staff: Team['staff'] = {};
        if (updates.staff.coach) {
            staff.coach = { ...updates.staff.coach, id: uuidv4() };
        }
        if (updates.staff.analyst) {
            staff.analyst = { ...updates.staff.analyst, id: uuidv4() };
        }
        if (updates.staff.manager) {
            staff.manager = { ...updates.staff.manager, id: uuidv4() };
        }
        team.staff = staff;
    }

    team.updatedAt = new Date();
    await team.save();
    return team.toObject();
}

// Delete team
export async function deleteTeam(teamId: string, userId: string): Promise<boolean> {
    await connectToDatabase();
    const result = await TeamModel.deleteOne({ id: teamId, userId });
    return result.deletedCount > 0;
}

// Get teams by IDs (for tournament team selection)
export async function getTeamsByIds(teamIds: string[]): Promise<Team[]> {
    await connectToDatabase();
    const teams = await TeamModel.find({ id: { $in: teamIds } });
    return teams.map((team: { toObject: () => Team }) => team.toObject());
}

// Verify team players (update player verification status)
export async function verifyTeamPlayers(
    teamId: string,
    playerUpdates: {
        playerId: string;
        verified: boolean;
        riotData?: RiotPlayerData;
    }[]
): Promise<Team | null> {
    await connectToDatabase();

    const team = await TeamModel.findOne({ id: teamId });
    if (!team) {
        return null;
    }

    // Update player verification status
    playerUpdates.forEach((update) => {
        // Check main players
        const mainPlayer = team.players.main.find((p: Player) => p.id === update.playerId);
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

        // Check substitute players
        const subPlayer = team.players.substitutes.find((p: Player) => p.id === update.playerId);
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

    // Auto-verify team if all players are verified
    const allMainVerified = team.players.main.length > 0 && team.players.main.every((p: Player) => p.verified);
    const allSubsVerified =
        team.players.substitutes.length === 0 || team.players.substitutes.every((p: Player) => p.verified);
    if (allMainVerified && allSubsVerified) {
        team.verified = true;
    } else {
        team.verified = false;
    }

    team.updatedAt = new Date();
    await team.save();
    return team.toObject();
}

// Check if team name or tag is available
export async function checkTeamAvailability(
    name: string,
    tag: string,
    excludeTeamId?: string
): Promise<{ nameAvailable: boolean; tagAvailable: boolean }> {
    await connectToDatabase();

    const query = excludeTeamId ? { id: { $ne: excludeTeamId } } : {};

    const [nameExists, tagExists] = await Promise.all([
        TeamModel.findOne({ ...query, name }),
        TeamModel.findOne({ ...query, tag })
    ]);

    return {
        nameAvailable: !nameExists,
        tagAvailable: !tagExists
    };
}
