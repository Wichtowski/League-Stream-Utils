"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Tournament } from "@lib/types";
import { tournamentStorage } from "@lib/services/tournament";

interface TournamentPageCardProps {
  tournament: Tournament;
  loading?: boolean;
}

export const TournamentPageCard = ({ tournament, loading = false }: TournamentPageCardProps): React.ReactElement => {
  const router = useRouter();

  const handleCardClick = async (): Promise<void> => {
    try {
      await tournamentStorage.setLastSelectedTournament(tournament._id);
    } catch (error) {
      console.error("Failed to save last selected tournament:", error);
    }
  };

  const handleSelectAsCurrent = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await tournamentStorage.setLastSelectedTournament(tournament._id);
      router.push("/modules");
    } catch (error) {
      console.error("Failed to save last selected tournament:", error);
    }
  };

  return (
    <Link
      href={`/modules/tournaments/${tournament._id}`}
      className={`bg-gray-800 hover:bg-blue-700 text-white rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-200 shadow-lg text-left block ${loading ? "blur-sm" : ""}`}
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">{tournament.name}</h3>
          <p className="text-gray-400 text-sm">{tournament.abbreviation}</p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs ${
            tournament.status === "draft"
              ? "bg-yellow-600"
              : tournament.status === "registration"
                ? "bg-blue-600"
                : tournament.status === "ongoing"
                  ? "bg-green-600"
                  : tournament.status === "completed"
                    ? "bg-gray-600"
                    : "bg-red-600"
          }`}
        >
          {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-400">Format:</span> {tournament.matchFormat} • {tournament.tournamentFormat}
        </div>
        <div>
          <span className="text-gray-400">Teams:</span> {tournament.registeredTeams.length} / {tournament.maxTeams}
        </div>
        <div>
          <span className="text-gray-400">Start:</span> {new Date(tournament.startDate).toLocaleDateString()}
        </div>
        {tournament.fearlessDraft && <div className="text-blue-400 text-xs">⚔️ Fearless Draft</div>}
      </div>
      <div className="flex justify-end items-center mt-2">
        <button
          onClick={handleSelectAsCurrent}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors duration-200"
        >
          Select as Current Tournament
        </button>
      </div>
    </Link>
  );
};
