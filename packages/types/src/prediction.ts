import type { TeamSide } from './draft';

export interface Prediction {
  id: string;
  matchId: string;
  userId: string;
  predictedWinner: TeamSide;
  createdAt: Date;
}
