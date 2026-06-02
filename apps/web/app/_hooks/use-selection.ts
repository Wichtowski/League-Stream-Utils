'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SelectionState {
  selectedTeamId: string | null;
  selectedMatchId: string | null;
  selectedTournamentId: string | null;

  selectTeam: (id: string | null) => void;
  selectMatch: (id: string | null, tournamentId?: string) => void;
  clearAll: () => void;
}

export const useSelection = create<SelectionState>()(
  devtools(
    (set) => ({
      selectedTeamId: null,
      selectedMatchId: null,
      selectedTournamentId: null,

      selectTeam: (id) => set({ selectedTeamId: id }),
      selectMatch: (id, tournamentId) =>
        set({ selectedMatchId: id, selectedTournamentId: tournamentId ?? null }),
      clearAll: () =>
        set({ selectedTeamId: null, selectedMatchId: null, selectedTournamentId: null }),
    }),
    { name: 'selection' },
  ),
);
