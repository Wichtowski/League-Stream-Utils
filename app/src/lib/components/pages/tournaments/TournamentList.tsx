"use client";

import type { Tournament } from "@lib/types";
import { TournamentCard } from "./TournamentCard";

interface TournamentListProps {
  tournaments: Tournament[];
  onShowCreateForm: () => void;
  onStatusUpdate: (tournamentId: string, status: Tournament["status"]) => void;
  onTournamentUpdate?: (tournament: Tournament) => void;
}

export const TournamentList = ({
  tournaments,
  onShowCreateForm,
  onStatusUpdate,
  onTournamentUpdate
}: TournamentListProps) => {
  if (tournaments.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl text-gray-400 mb-4">No tournaments created yet</h3>
        <button
          onClick={onShowCreateForm}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
        >
          Create Your First Tournament
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {tournaments.map((tournament) => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          onStatusUpdate={onStatusUpdate}
          onTournamentUpdate={onTournamentUpdate}
        />
      ))}
    </div>
  );
};
