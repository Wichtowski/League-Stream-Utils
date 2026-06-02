import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface CameraUIState {
  selectedTeamId: string | null;
  selectTeam: (id: string | null) => void;
}

export const useCameraStore = create<CameraUIState>()(devtools((set) => ({
  selectedTeamId: null,
  selectTeam: (id) => set({ selectedTeamId: id }),
}), { name: 'camera' }));
