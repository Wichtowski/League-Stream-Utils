import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface TeamUIState {
  selectedTeamId: string | null;
  filterQuery: string;
  selectTeam: (id: string | null) => void;
  setFilter: (query: string) => void;
}

export const useTeamStore = create<TeamUIState>()(
  devtools(
    (set) => ({
      selectedTeamId: null,
      filterQuery: "",
      selectTeam: (id) => set({ selectedTeamId: id }),
      setFilter: (query) => set({ filterQuery: query }),
    }),
    { name: "team" },
  ),
);
