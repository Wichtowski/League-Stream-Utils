import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from './connection';
import { MatchModel } from './models';
import { TeamModel } from './models';
import { TournamentModel } from './models';
import type { Match, CreateMatchRequest, UpdateMatchRequest, AssignCommentatorRequest, SubmitPredictionRequest, MatchCommentator, MatchPrediction } from '@lib/types/match';

export async function createMatch(userId: string, matchData: CreateMatchRequest): Promise<Match> {
  await connectToDatabase();

  // Fetch team data
  const blueTeam = await TeamModel.findOne({ id: matchData.blueTeamId });
  const redTeam = await TeamModel.findOne({ id: matchData.redTeamId });

  if (!blueTeam || !redTeam) {
    throw new Error('One or both teams not found');
  }

  // Fetch tournament data if it's a tournament match
  let tournamentData = null;
  if (matchData.tournamentId) {
    tournamentData = await TournamentModel.findOne({ id: matchData.tournamentId });
    if (!tournamentData) {
      throw new Error('Tournament not found');
    }
  }

  const matchDoc: Match = {
    id: uuidv4(),
    name: matchData.name,
    type: matchData.type,
    tournamentId: matchData.tournamentId,
    tournamentName: tournamentData?.name,
    tournamentLogo: tournamentData?.logo,
    bracketNodeId: matchData.bracketNodeId,
    blueTeam: {
      id: blueTeam.id,
      name: blueTeam.name,
      tag: blueTeam.tag,
      logo: blueTeam.logo,
      colors: blueTeam.colors,
      players: blueTeam.players.main,
      coach: blueTeam.staff?.coach ? {
        name: blueTeam.staff.coach.name,
        profileImage: blueTeam.staff.coach.profileImage
      } : undefined
    },
    redTeam: {
      id: redTeam.id,
      name: redTeam.name,
      tag: redTeam.tag,
      logo: redTeam.logo,
      colors: redTeam.colors,
      players: redTeam.players.main,
      coach: redTeam.staff?.coach ? {
        name: redTeam.staff.coach.name,
        profileImage: redTeam.staff.coach.profileImage
      } : undefined
    },
    format: matchData.format,
    isFearlessDraft: matchData.isFearlessDraft,
    patchName: matchData.patchName,
    scheduledTime: matchData.scheduledTime ? new Date(matchData.scheduledTime) : undefined,
    status: 'scheduled',
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
  return newMatch.toObject();
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  await connectToDatabase();
  const match = await MatchModel.findOne({ id: matchId });
  return match ? match.toObject() : null;
}

export async function getMatchesByTournament(tournamentId: string): Promise<Match[]> {
  await connectToDatabase();
  const matches = await MatchModel.find({ tournamentId }).sort({ scheduledTime: 1 });
  return matches.map(match => match.toObject());
}

export async function getStandaloneMatches(): Promise<Match[]> {
  await connectToDatabase();
  const matches = await MatchModel.find({ type: 'standalone' }).sort({ scheduledTime: 1 });
  return matches.map(match => match.toObject());
}

export async function getMatchesByCommentator(commentatorId: string): Promise<Match[]> {
  await connectToDatabase();
  const matches = await MatchModel.find({ 'commentators.id': commentatorId }).sort({ scheduledTime: 1 });
  return matches.map(match => match.toObject());
}

export async function updateMatch(matchId: string, userId: string, updates: UpdateMatchRequest): Promise<Match | null> {
  await connectToDatabase();

  const match = await MatchModel.findOne({ id: matchId });
  if (!match) {
    return null;
  }

  // Check permissions (only creator or admin can update)
  if (match.createdBy !== userId) {
    throw new Error('Forbidden: Only match creator can update match');
  }

  if (updates.name) match.name = updates.name;
  if (updates.scheduledTime) match.scheduledTime = new Date(updates.scheduledTime);
  if (updates.status) match.status = updates.status;
  if (updates.winner) match.winner = updates.winner;
  if (updates.score) match.score = updates.score;

  match.updatedAt = new Date();
  await match.save();
  return match.toObject();
}

export async function assignCommentator(matchId: string, userId: string, request: AssignCommentatorRequest): Promise<Match | null> {
  await connectToDatabase();

  const match = await MatchModel.findOne({ id: matchId });
  if (!match) {
    return null;
  }

  // Check permissions (only creator or admin can assign commentators)
  if (match.createdBy !== userId) {
    throw new Error('Forbidden: Only match creator can assign commentators');
  }

  // Add commentator to match
  const newCommentator = {
    id: request.commentatorId,
    name: 'Commentator', // This should be fetched from commentator data
    assignedAt: new Date(),
    assignedBy: request.assignedBy
  };

  // Remove existing assignment for this commentator if exists
  match.commentators = match.commentators.filter((c: MatchCommentator) => c.id !== request.commentatorId);
  match.commentators.push(newCommentator);

  match.updatedAt = new Date();
  await match.save();
  return match.toObject();
}

export async function submitPrediction(matchId: string, commentatorId: string, request: SubmitPredictionRequest): Promise<Match | null> {
  await connectToDatabase();

  const match = await MatchModel.findOne({ id: matchId });
  if (!match) {
    return null;
  }

  // Check if commentator is assigned to this match
  const commentator = match.commentators.find((c: MatchCommentator) => c.id === commentatorId);
  if (!commentator) {
    throw new Error('Forbidden: Only assigned commentators can submit predictions');
  }

  // Remove existing prediction from this commentator
  match.predictions = match.predictions.filter((p: MatchPrediction) => p.commentatorId !== commentatorId);

  // Add new prediction
  const newPrediction = {
    commentatorId,
    commentatorName: commentator.name,
    prediction: request.prediction,
    timestamp: new Date()
  };

  match.predictions.push(newPrediction);
  match.updatedAt = new Date();
  await match.save();
  return match.toObject();
}

export async function deleteMatch(matchId: string, userId: string): Promise<boolean> {
  await connectToDatabase();

  const match = await MatchModel.findOne({ id: matchId });
  if (!match) {
    return false;
  }

  // Check permissions (only creator or admin can delete)
  if (match.createdBy !== userId) {
    throw new Error('Forbidden: Only match creator can delete match');
  }

  await MatchModel.deleteOne({ id: matchId });
  return true;
} 