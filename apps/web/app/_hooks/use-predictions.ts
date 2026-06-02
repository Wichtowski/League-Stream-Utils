'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Prediction {
  matchId: string;
  winner: 'blue' | 'red';
  score: string; // e.g. "2-1"
  createdAt: number;
}

interface PredictionState {
  predictions: Record<string, Prediction>;
  setPrediction: (matchId: string, winner: 'blue' | 'red', score: string) => void;
  removePrediction: (matchId: string) => void;
  getPrediction: (matchId: string) => Prediction | undefined;
}

export const usePredictions = create<PredictionState>()(
  devtools(
    persist(
      (set, get) => ({
        predictions: {},
        setPrediction: (matchId, winner, score) =>
          set((s) => ({
            predictions: {
              ...s.predictions,
              [matchId]: { matchId, winner, score, createdAt: Date.now() },
            },
          })),
        removePrediction: (matchId) =>
          set((s) => {
            const { [matchId]: _, ...rest } = s.predictions;
            return { predictions: rest };
          }),
        getPrediction: (matchId) => get().predictions[matchId],
      }),
      { name: 'predictions' },
    ),
    { name: 'predictions' },
  ),
);
