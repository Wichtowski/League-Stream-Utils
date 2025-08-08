"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTournaments } from "@lib/contexts/TournamentsContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/components/modal";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { tournamentStorage } from "@lib/utils/storage/tournament-storage";

export default function TournamentsPage() {
  const { tournaments, loading: tournamentsLoading, error } = useTournaments();
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();

  useEffect(() => {
    setActiveModule("tournaments");
  }, [setActiveModule]);

  useEffect(() => {
    if (error) {
      showAlert({ type: "error", message: error });
    }
  }, [error, showAlert]);

  if (tournamentsLoading && tournaments.length === 0) {
    return (
      <PageWrapper loadingMessage="Loading tournaments...">
        <LoadingSpinner fullscreen text="Loading tournaments..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      loadingMessage="Loading tournaments..."
      title="My Tournaments"
      breadcrumbs={[{ label: "Tournaments", href: "/modules/tournaments" }]}
      actions={
        tournaments.length > 0 && (
          <Link
            href="/modules/tournaments/create"
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
          >
            Create Tournament
          </Link>
        )
      }
    >
      {tournaments.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl text-gray-400 mb-4">No tournaments created yet</h3>
          <Link
            href="/modules/tournaments/create"
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
          >
            Create Your First Tournament
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="text-xl text-white mb-6 text-center">Select Tournament to Edit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/modules/tournaments/${tournament.id}`}
                className="bg-gray-800 hover:bg-blue-700 text-white rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-200 shadow-lg text-left block"
                onClick={async () => {
                  try {
                    await tournamentStorage.setLastSelectedTournament(tournament.id, tournament.name);
                  } catch (error) {
                    console.error("Failed to save last selected tournament:", error);
                  }
                }}
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
                    <span className="text-gray-400">Format:</span> {tournament.matchFormat} •{" "}
                    {tournament.tournamentFormat}
                  </div>
                  <div>
                    <span className="text-gray-400">Teams:</span> {tournament.registeredTeams.length} /{" "}
                    {tournament.maxTeams}
                  </div>
                  <div>
                    <span className="text-gray-400">Start:</span> {new Date(tournament.startDate).toLocaleDateString()}
                  </div>
                  {tournament.fearlessDraft && <div className="text-blue-400 text-xs">⚔️ Fearless Draft</div>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
