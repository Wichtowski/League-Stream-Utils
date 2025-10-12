"use client";

import { useEffect, Suspense, useMemo } from "react";
import { useParams } from "next/navigation";
import { useCurrentTournament } from "@libTournament/contexts/CurrentTournamentContext";
import { useTournamentData } from "@libTournament/contexts/TournamentDataContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout";
import { TournamentStatus } from "@libTournament/types";
import { TournamentEditor } from "@libTournament/components/tournament/TournamentEditor";

export default function TournamentDetailPage() {
  const { currentTournament, loading: tournamentsLoading, error, refreshCurrentTournament } = useCurrentTournament();
  const { updateTournament } = useTournamentData();
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const pageProps = useMemo(() => {
    return {
      title: !currentTournament?.name
        ? tournamentsLoading
          ? "Loading Tournament"
          : "Tournament Not Found"
        : currentTournament.name,
      subtitle: `Tournament details and settings ${currentTournament?.abbreviation ? "for " + currentTournament?.abbreviation : ""}`,
      breadcrumbs: [
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: currentTournament?.name ?? "Loading...", href: `/modules/tournaments/${tournamentId}`, isActive: true }
      ]
    };
  }, [currentTournament, tournamentId, tournamentsLoading]);

  useEffect(() => {
    setActiveModule("currentTournament");
  }, [setActiveModule]);

  const handleTournamentUpdated = (): void => {
    refreshCurrentTournament();
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
        refreshCurrentTournament();
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

  if (tournamentsLoading || !currentTournament) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading tournament..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper {...pageProps}>
      <Suspense fallback={<LoadingSpinner text="Loading tournament editor..." />}>
        <TournamentEditor
          tournament={currentTournament}
          onStatusUpdate={updateTournamentStatus}
          onTournamentUpdate={handleTournamentUpdated}
        />
      </Suspense>
    </PageWrapper>
  );
}
