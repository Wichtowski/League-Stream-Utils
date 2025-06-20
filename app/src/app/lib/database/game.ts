import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from './connection';
import { GameSession } from './models';
import type { GameSession as GameSessionType, Champion } from '@lib/types';

interface MongooseDocument extends Omit<GameSessionType, '_id'> {
  _id?: string | object;
  __v?: number;
}

// Helper function to transform mongoose document to GameSession
function transformToGameSession(doc: MongooseDocument): GameSessionType {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, __v, ...gameSession } = doc;
  return gameSession as GameSessionType;
}

export async function createGameSession(sessionData: Partial<GameSessionType>): Promise<GameSessionType> {
  await connectToDatabase();
  
  const defaultTeam = {
    id: '',
    name: '',
    side: 'blue' as const,
    bans: [],
    picks: [],
    currentPick: undefined,
    isReady: false,
    coach: { name: '', id: '' },
    logoUrl: '',
    usedChampions: []
  };

  const defaultSession = {
    id: uuidv4(),
    teams: {
      blue: { ...defaultTeam, id: 'blue', name: 'Team Blue', side: 'blue' as const },
      red: { ...defaultTeam, id: 'red', name: 'Team Red', side: 'red' as const }
    },
    phase: 'config' as const,
    currentTeam: 'blue' as const,
    turnNumber: 0,
    createdAt: new Date(),
    lastActivity: new Date(),
    timer: {
      remaining: 0,
      totalTime: 0,
      isActive: false,
      startedAt: undefined
    },
    bothTeamsReady: false,
    config: {
      seriesType: 'BO1' as const,
      currentGame: 1,
      totalGames: 1,
      isFearlessDraft: false,
      patchName: '14.1',
      blueTeamName: undefined,
      redTeamName: undefined,
      blueCoach: { name: '', id: '' },
      redCoach: { name: '', id: '' },
      blueTeamLogo: undefined,
      redTeamLogo: undefined,
      tournamentName: undefined,
      tournamentLogo: undefined
    },
    gameHistory: [],
    seriesScore: { blue: 0, red: 0 }
  };

  const sessionToSave = { ...defaultSession, ...sessionData };
  const session = new GameSession(sessionToSave);
  const saved = await session.save();
  
  return transformToGameSession(saved.toObject());
}

export async function saveGameSession(session: GameSessionType): Promise<GameSessionType> {
  await connectToDatabase();
  
  try {
    const existingSession = await GameSession.findOne({ id: session.id });
    
    if (existingSession) {
      const updated = await GameSession.findOneAndUpdate(
        { id: session.id },
        { ...session, lastActivity: new Date() },
        { new: true }
      );
      if (!updated) throw new Error('Failed to update session');
      return transformToGameSession(updated.toObject());
    } else {
      const newSession = new GameSession(session);
      const saved = await newSession.save();
      return transformToGameSession(saved.toObject());
    }
  } catch (error) {
    console.error('Error saving game session:', error);
    throw error;
  }
}

export async function getGameSession(sessionId: string): Promise<GameSessionType | null> {
  await connectToDatabase();
  
  try {
    const session = await GameSession.findOne({ id: sessionId }).lean();
    if (!session) return null;
    return transformToGameSession(session as MongooseDocument);
  } catch (error) {
    console.error('Error getting game session:', error);
    throw error;
  }
}

export async function updateGameSession(sessionId: string, updateData: Partial<GameSessionType>): Promise<GameSessionType | null> {
  await connectToDatabase();
  
  const session = await GameSession.findOneAndUpdate(
    { id: sessionId },
    { ...updateData, lastActivity: new Date() },
    { new: true }
  );
  
  return session ? transformToGameSession(session.toObject()) : null;
}

export async function deleteGameSession(sessionId: string): Promise<boolean> {
  await connectToDatabase();
  
  try {
    const result = await GameSession.deleteOne({ id: sessionId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting game session:', error);
    throw error;
  }
}

export async function getAllGameSessions(): Promise<GameSessionType[]> {
  await connectToDatabase();
  
  try {
    const sessions = await GameSession.find({}).lean();
    return sessions.map(doc => transformToGameSession(doc as MongooseDocument));
  } catch (error) {
    console.error('Error getting all game sessions:', error);
    throw error;
  }
}

export async function cleanupOldSessions(olderThanHours: number = 24): Promise<number> {
  await connectToDatabase();
  
  try {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const result = await GameSession.deleteMany({
      lastActivity: { $lt: cutoffDate }
    });
    return result.deletedCount || 0;
  } catch (error) {
    console.error('Error cleaning up old sessions:', error);
    throw error;
  }
}

// Fearless draft helpers
export async function getUsedChampionsInSeries(sessionId: string): Promise<Champion[]> {
  await connectToDatabase();
  
  try {
    const session = await GameSession.findOne({ id: sessionId }).lean();
    if (!session) return [];
    
    const transformedSession = transformToGameSession(session as MongooseDocument);
    
    const allUsedChampions = [
      ...(transformedSession.teams.blue.usedChampions || []),
      ...(transformedSession.teams.red.usedChampions || [])
    ];
    
    const uniqueChampions = allUsedChampions.filter((champion, index, self) =>
      index === self.findIndex(c => c.id === champion.id)
    );
    
    return uniqueChampions;
  } catch (error) {
    console.error('Error getting used champions:', error);
    throw error;
  }
}

export async function addUsedChampion(sessionId: string, teamSide: 'blue' | 'red', champion: Champion): Promise<void> {
  await connectToDatabase();
  
  try {
    await GameSession.findOneAndUpdate(
      { id: sessionId },
      { 
        $addToSet: { [`teams.${teamSide}.usedChampions`]: champion },
        lastActivity: new Date()
      }
    );
  } catch (error) {
    console.error('Error adding used champion:', error);
    throw error;
  }
} 