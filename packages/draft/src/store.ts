import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { GamePhase, TeamSide, draftAction, DraftTimer } from '@lsu/types';

interface draftUIState {
  sessionId: string | null;
  status: 'idle' | 'connecting' | 'connected' | 'error';
  currentPhase: GamePhase;
  currentTeam: TeamSide;
  turnNumber: number;
  timer: DraftTimer;
  actions: draftAction[];
  selectedChampionId: number | null;
  wsError: string | null;

  setSession: (id: string) => void;
  setStatus: (status: draftUIState['status']) => void;
  setPhase: (phase: GamePhase) => void;
  setTeam: (team: TeamSide) => void;
  setTurn: (turn: number) => void;
  setTimer: (timer: DraftTimer) => void;
  addAction: (action: draftAction) => void;
  setActions: (actions: draftAction[]) => void;
  selectChampion: (id: number | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  status: 'idle' as const,
  currentPhase: 'config' as GamePhase,
  currentTeam: 'blue' as TeamSide,
  turnNumber: 0,
  timer: { remaining: 30, totalTime: 30, isActive: false },
  actions: [] as draftAction[],
  selectedChampionId: null,
  wsError: null,
};

export const usedraftStore = create<draftUIState>()(
  devtools(
    (set) => ({
      ...initialState,
      setSession: (id) => set({ sessionId: id, status: 'idle' }),
      setStatus: (status) => set({ status }),
      setPhase: (phase) => set({ currentPhase: phase }),
      setTeam: (team) => set({ currentTeam: team }),
      setTurn: (turn) => set({ turnNumber: turn }),
      setTimer: (timer) => set({ timer }),
      addAction: (action) => set((s) => ({ actions: [...s.actions, action] })),
      setActions: (actions) => set({ actions }),
      selectChampion: (id) => set({ selectedChampionId: id }),
      setError: (error) => set({ wsError: error }),
      reset: () => set(initialState),
    }),
    { name: 'draft' },
  ),
);
