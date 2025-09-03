import { Types } from "mongoose";
import { connectToDatabase } from "@lib/database/connection";
import { MatchModel, TournamentModel } from "@libTournament/database/models";
import { TeamModel } from "@libTeam/database/models";
import type {
  Match,
  CreateMatchRequest,
  UpdateMatchRequest,
  AssignCommentatorRequest,
  SubmitPredictionRequest,
  MatchCommentator
} from "@lib/types/match";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformToMatch = (doc: any): Match => {
  const plain = typeof doc?.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, ...match } = plain ?? {};
  return { ...(match as object), _id: _id?.toString() || "" } as Match;
};

export async function createMatch(userId: string, matchData: CreateMatchRequest): Promise<Match> {
  await connectToDatabase();

  // Fetch team data
  const blueTeam = await TeamModel.findOne({ _id: matchData.blueTeamId });
  const redTeam = await TeamModel.findOne({ _id: matchData.redTeamId });

  if (!blueTeam || !redTeam) {
    throw new Error("One or both teams not found");
  }

  // Fetch tournament data if it's a tournament match
  let tournamentData = null;
  if (matchData.tournamentId) {
    tournamentData = await TournamentModel.findOne({
      _id: matchData.tournamentId
    }).lean();
    if (!tournamentData) {
      throw new Error("Tournament not found");
    }
  }

  const matchDoc: Match = {
    _id: new Types.ObjectId().toString(),
    name: matchData.name,
    type: matchData.type,
    tournamentId: matchData.tournamentId,
    bracketNodeId: matchData.bracketNodeId,
    blueTeamId: blueTeam._id?.toString() || "",
    redTeamId: redTeam._id?.toString() || "",
    format: matchData.format,
    isFearlessDraft: matchData.isFearlessDraft,
    patchName: matchData.patchName,
    scheduledTime: matchData.scheduledTime ? new Date(matchData.scheduledTime) : undefined,
    status: "scheduled",
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
  const match = await MatchModel.findOne({ _id: matchId }).lean();
  if (!match) return null;

  return transformToMatch(match);
}

export async function getMatchesByTournament(tournamentId: string): Promise<Match[]> {
  await connectToDatabase();
  const matches = await MatchModel.find({ tournamentId })
    .populate("blueTeamId", "name tag logo colors")
    .populate("redTeamId", "name tag logo colors")
    .sort({
      scheduledTime: 1
    })
    .lean();
  return matches.map(transformToMatch);
}

export async function getStandaloneMatches(): Promise<Match[]> {
  await connectToDatabase();
  const matches = await MatchModel.find({ type: "standalone" })
    .sort({
      scheduledTime: 1
    })
    .lean();
  return matches.map(transformToMatch);
}

export async function getMatchesByCommentator(commentatorId: string): Promise<Match[]> {
  await connectToDatabase();
  const matches = await MatchModel.find({
    "commentators.id": commentatorId
  })
    .sort({ scheduledTime: 1 })
    .lean();
  return matches.map(transformToMatch);
}

export async function updateMatch(matchId: string, userId: string, updates: UpdateMatchRequest): Promise<Match | null> {
  await connectToDatabase();

  const match = await MatchModel.findOne({ _id: matchId });
  if (!match) {
    return null;
  }

  // Check permissions (only creator or admin can update)
  const matchCreator = transformToMatch(match).createdBy;
  if (matchCreator !== userId) {
    throw new Error("Forbidden: Only match creator can update match");
  }

  const updateOps: Record<string, unknown> = {
    updatedAt: new Date()
  };
  if (updates.status !== undefined) updateOps.status = updates.status;
  if (updates.name !== undefined) updateOps.name = updates.name;
  if (updates.scheduledTime !== undefined) updateOps.scheduledTime = new Date(updates.scheduledTime);
  if ((updates as unknown as { format?: Match["format"] }).format !== undefined)
    updateOps.format = (updates as unknown as { format: Match["format"] }).format;
  if ((updates as unknown as { blueTeamId?: string }).blueTeamId !== undefined)
    updateOps.blueTeamId = (updates as unknown as { blueTeamId: string }).blueTeamId;
  if ((updates as unknown as { redTeamId?: string }).redTeamId !== undefined)
    updateOps.redTeamId = (updates as unknown as { redTeamId: string }).redTeamId;
  if ((updates as unknown as { games?: Match["games"] }).games !== undefined)
    updateOps.games = (updates as unknown as { games: Match["games"] }).games;
  if ((updates as unknown as { score?: { blue: number; red: number } }).score !== undefined)
    updateOps.score = (updates as unknown as { score: { blue: number; red: number } }).score;

  const updatedMatch = await MatchModel.findOneAndUpdate({ _id: matchId }, updateOps, { new: true });

  return updatedMatch ? transformToMatch(updatedMatch) : null;
}

export async function assignCommentator(
  matchId: string,
  userId: string,
  request: AssignCommentatorRequest
): Promise<Match | null> {
  await connectToDatabase();

  const match = await MatchModel.findOne({ _id: matchId });
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
    { _id: matchId },
    {
      $push: { commentators: newCommentator },
      $pull: { commentators: { id: request.commentatorId } },
      updatedAt: new Date()
    },
    { new: true }
  );

  return updatedMatch ? transformToMatch(updatedMatch) : null;
}

export async function submitPrediction(
  matchId: string,
  commentatorId: string,
  request: SubmitPredictionRequest
): Promise<Match | null> {
  await connectToDatabase();

  const match = await MatchModel.findOne({ _id: matchId });
  if (!match) {
    return null;
  }

  // Check if commentator is assigned to this match
  const matchData = transformToMatch(match);
  const commentator = matchData.commentators.find((c: MatchCommentator) => c._id === commentatorId);
  if (!commentator) {
    throw new Error("Forbidden: Only assigned commentators can submit predictions");
  }

  const updatedMatch = await MatchModel.findOneAndUpdate(
    { _id: matchId },
    {
      $push: {
        predictions: {
          commentatorId,
          commentatorName: commentator.name,
          prediction: request.prediction,
          timestamp: new Date()
        }
      },
      $pull: { predictions: { commentatorId } },
      updatedAt: new Date()
    },
    { new: true }
  );

  return updatedMatch ? transformToMatch(updatedMatch) : null;
}

export async function deleteMatch(matchId: string, userId: string): Promise<boolean> {
  await connectToDatabase();

  const match = await MatchModel.findOne({ _id: matchId });
  if (!match) {
    return false;
  }

  // Check permissions (only creator or admin can delete)
  if (transformToMatch(match).createdBy !== userId) {
    throw new Error("Forbidden: Only match creator can delete match");
  }

  await MatchModel.deleteOne({ _id: matchId });
  return true;
}
