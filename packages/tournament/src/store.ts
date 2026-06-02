import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TournamentUIState {
  selectedTournamentId: string | null;
  selectedMatchId: string | null;
  view: 'list' | 'bracket' | 'matches' | 'settings';
  selectTournament: (id: string | null) => void;
  selectMatch: (id: string | null) => void;
  setView: (view: TournamentUIState['view']) => void;
}

export const useTournamentStore = create<TournamentUIState>()(devtools((set) => ({
  selectedTournamentId: null,
  selectedMatchId: null,
  view: 'list',
  selectTournament: (id) => set({ selectedTournamentId: id, view: id ? 'bracket' : 'list' }),
  selectMatch: (id) => set({ selectedMatchId: id }),
  setView: (view) => set({ view }),
}), { name: 'tournament' }));
