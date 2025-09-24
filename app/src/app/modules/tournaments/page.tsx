"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTournaments } from "@libTournament/contexts/TournamentsContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { PageWrapper } from "@lib/layout";
import { TournamentPageCard } from "@libTournament/components";
import { LoadingSpinner } from "@lib/components/common";

export default function TournamentsPage() {
  const { tournaments, loading: tournamentsLoading, error, refreshTournaments } = useTournaments();
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    setActiveModule("tournaments");

    // Only refresh tournaments data once when entering the page
    // This prevents rate limiting from multiple rapid calls
    if (!hasRefreshed.current) {
      hasRefreshed.current = true;
      refreshTournaments();
    }
  }, [setActiveModule, refreshTournaments]);

  useEffect(() => {
    if (error) {
      showAlert({ type: "error", message: error });
    }
  }, [error, showAlert]);

  if (tournamentsLoading && tournaments.length === 0) {
    return (
      <PageWrapper
        loading={tournamentsLoading}
        title="My Tournaments"
        breadcrumbs={[{ label: "Tournaments", href: "/modules/tournaments" }]}
      >
        <LoadingSpinner fullscreen >Loading Tournaments...</LoadingSpinner>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
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
              <TournamentPageCard key={tournament._id} tournament={tournament} />
            ))}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
