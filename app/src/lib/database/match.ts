import { v4 as uuidv4 } from "uuid";
import { connectToDatabase } from "./connection";
import { MatchModel } from "./models";
import { TeamModel } from "./models";
import { TournamentModel } from "./models";
import type {
  Match,
  CreateMatchRequest,
  UpdateMatchRequest,
  AssignCommentatorRequest,
  SubmitPredictionRequest,
  MatchCommentator,
} from "@lib/types/match";
import { ImageStorage, TeamColors } from "@lib/types/common";
import { Player } from "@lib/types/game";

// Helper function to transform mongoose document to Match
function transformToMatch(doc: { _id?: unknown; __v?: number; [key: string]: unknown }): Match {
  const { _id, __v, ...match } = doc;
  return match as unknown as Match;
}

export async function createMatch(userId: string, matchData: CreateMatchRequest): Promise<Match> {
  await connectToDatabase();

  // Fetch team data
  const blueTeam = await TeamModel.findOne({ id: matchData.blueTeamId }).lean();
  const redTeam = await TeamModel.findOne({ id: matchData.redTeamId }).lean();

  if (!blueTeam || !redTeam) {
    throw new Error("One or both teams not found");
  }

  // Fetch tournament data if it's a tournament match
  let tournamentData = null;
  if (matchData.tournamentId) {
    tournamentData = await TournamentModel.findOne({
      id: matchData.tournamentId
    }).lean();
    if (!tournamentData) {
      throw new Error("Tournament not found");
    }
  }

  const matchDoc: Match = {
    id: uuidv4(),
    name: matchData.name,
    type: matchData.type,
    tournamentId: matchData.tournamentId,
    bracketNodeId: matchData.bracketNodeId,
    blueTeam: {
      id: blueTeam.id,
      name: blueTeam.name,
      tag: blueTeam.tag,
      logo: blueTeam.logo as ImageStorage,
      colors: blueTeam.colors as TeamColors,
      players: blueTeam.players?.main as Player[],
      coach: blueTeam.staff?.coach
        ? {
            name: blueTeam.staff.coach.name
          }
        : undefined
    },
    redTeam: {
      id: redTeam.id,
      name: redTeam.name,
      tag: redTeam.tag,
      logo: redTeam.logo as ImageStorage,
      colors: redTeam.colors as TeamColors,
      players: redTeam.players?.main as Player[],
      coach: redTeam.staff?.coach
        ? {
            name: redTeam.staff.coach.name
          }
        : undefined
    },
    format: matchData.format,
    isFearlessDraft: matchData.isFearlessDraft,
    patchName: matchData.patchName,
    scheduledTime: matchData.scheduledTime ? new Date(matchData.scheduledTime) : undefined,
    status: "scheduled",
    score: { blue: 0, red: 0 },
    games: [],
    commentators: [],
    predictions: [],
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const newMatch = new MatchModel(matchDoc);
  await newMatch.save();
  return matchDoc;
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  await connectToDatabase();
  const match = await MatchModel.findOne({ id: matchId }).lean();
  return match ? transformToMatch(match) : null;
}

export async function getMatchesByTournament(tournamentId: string): Promise<Match[]> {
  await connectToDatabase();
  const matches = await MatchModel.find({ tournamentId }).sort({
    scheduledTime: 1
  }).lean();
  return matches.map(transformToMatch);
}

export async function getStandaloneMatches(): Promise<Match[]> {
  await connectToDatabase();
  const matches = await MatchModel.find({ type: "standalone" }).sort({
    scheduledTime: 1
  }).lean();
  return matches.map(transformToMatch);
}

export async function getMatchesByCommentator(commentatorId: string): Promise<Match[]> {
  await connectToDatabase();
  const matches = await MatchModel.find({
    "commentators.id": commentatorId
  }).sort({ scheduledTime: 1 }).lean();
  return matches.map(transformToMatch);
}

export async function updateMatch(matchId: string, userId: string, updates: UpdateMatchRequest): Promise<Match | null> {
  await connectToDatabase();

  const match = await MatchModel.findOne({ id: matchId }).lean();
  if (!match) {
    return null;
  }

  // Check permissions (only creator or admin can update)
  if (transformToMatch(match).createdBy !== userId) {
    throw new Error("Forbidden: Only match creator can update match");
  }

  const updatedMatch = await MatchModel.findOneAndUpdate(
    { id: matchId },
    {
      ...updates,
      scheduledTime: updates.scheduledTime ? new Date(updates.scheduledTime) : undefined,
      updatedAt: new Date()
    },
    { new: true }
  ).lean();

  return updatedMatch ? transformToMatch(updatedMatch) : null;
}

export async function assignCommentator(
  matchId: string,
  userId: string,
  request: AssignCommentatorRequest
): Promise<Match | null> {
  await connectToDatabase();

  const match = await MatchModel.findOne({ id: matchId }).lean();
  if (!match) {
    return null;
  }

  // Check permissions (only creator or admin can assign commentators)
  if (transformToMatch(match).createdBy !== userId) {
    throw new Error("Forbidden: Only match creator can assign commentators");
  }

  // Add commentator to match
  const newCommentator = {
    id: request.commentatorId,
    name: "Commentator", // This should be fetched from commentator data
    assignedAt: new Date(),
    assignedBy: request.assignedBy
  };

  const updatedMatch = await MatchModel.findOneAndUpdate(
    { id: matchId },
    {
      $push: { commentators: newCommentator },
      $pull: { commentators: { id: request.commentatorId } },
      updatedAt: new Date()
    },
    { new: true }
  ).lean();

  return updatedMatch ? transformToMatch(updatedMatch) : null;
}

export async function submitPrediction(
  matchId: string,
  commentatorId: string,
  request: SubmitPredictionRequest
): Promise<Match | null> {
  await connectToDatabase();

  const match = await MatchModel.findOne({ id: matchId }).lean();
  if (!match) {
    return null;
  }

  // Check if commentator is assigned to this match
  const matchData = transformToMatch(match);
  const commentator = matchData.commentators.find((c: MatchCommentator) => c.id === commentatorId);
  if (!commentator) {
    throw new Error("Forbidden: Only assigned commentators can submit predictions");
  }

  const updatedMatch = await MatchModel.findOneAndUpdate(
    { id: matchId },
    {
      $push: { predictions: {
        commentatorId,
        commentatorName: commentator.name,
        prediction: request.prediction,
        timestamp: new Date()
      }},
      $pull: { predictions: { commentatorId } },
      updatedAt: new Date()
    },
    { new: true }
  ).lean();

  return updatedMatch ? transformToMatch(updatedMatch) : null;
}

export async function deleteMatch(matchId: string, userId: string): Promise<boolean> {
  await connectToDatabase();

  const match = await MatchModel.findOne({ id: matchId }).lean();
  if (!match) {
    return false;
  }

  // Check permissions (only creator or admin can delete)
  if (transformToMatch(match).createdBy !== userId) {
    throw new Error("Forbidden: Only match creator can delete match");
  }

  await MatchModel.deleteOne({ id: matchId });
  return true;
}
