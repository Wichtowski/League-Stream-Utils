"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTournaments } from "@libTournament/contexts/TournamentsContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout";
import { Tournament, TournamentStatus } from "@libTournament/types";
import { TournamentEditor } from "@libTournament/components/tournament/TournamentEditor";

export default function TournamentDetailPage() {
  const router = useRouter();
  const { tournaments, loading: tournamentsLoading, error, refreshTournaments, updateTournament } = useTournaments();
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const pageProps = useMemo(() => {
    return {
      title: !tournament?.name ? (tournamentsLoading ? "Loading Tournament" : "Tournament Not Found") : tournament.name,
      subtitle: `Tournament details and settings ${tournament?.abbreviation ? "for " + tournament?.abbreviation : ""}`,
      breadcrumbs: [
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: tournament?.name ?? "Loading...", href: `/modules/tournaments/${tournamentId}`, isActive: true }
      ],
      actions: <button onClick={() => router.push("/modules/tournaments/create")} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors">Create Tournament</button>
    }
  }, [tournament, tournamentId, router, tournamentsLoading]);
  
  useEffect(() => {
    setActiveModule("tournaments");
  }, [setActiveModule]);

  useEffect(() => {
    if (tournaments.length > 0 && tournamentId) {
      const foundTournament = tournaments.find((t) => t._id === tournamentId);
      if (foundTournament) {
        setTournament(foundTournament);
      } else {
        showAlert({
          type: "error",
          message: "Tournament not found"
        });
        router.push("/modules/tournaments");
      }
    }
  }, [tournaments, tournamentId, showAlert, router]);

  const handleTournamentUpdated = (): void => {
    refreshTournaments();
  };

  const updateTournamentStatus = async (tournamentId: string, status: TournamentStatus): Promise<void> => {
    try {
      const result = await updateTournament(tournamentId, { status });
      if (!result.success) {
        await showAlert({
          type: "error",
          message: result.error || "Failed to update tournament status"
        });
      } else {
        refreshTournaments();
      }
    } catch (error) {
      await showAlert({
        type: "error",
        message: "Failed to update tournament status"
      });
      console.error("Failed to update tournament status:", error);
    }
  };

  useEffect(() => {
    if (error) {
      showAlert({ type: "error", message: error });
    }
  }, [error, showAlert]);

  if (tournamentsLoading || !tournament) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading tournament..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper {...pageProps} >
      <Suspense fallback={<LoadingSpinner text="Loading tournament editor..." />}>
        <TournamentEditor
          tournament={tournament}
          onStatusUpdate={updateTournamentStatus}
          onTournamentUpdate={handleTournamentUpdated}
        />
      </Suspense>
    </PageWrapper>
  );
}
