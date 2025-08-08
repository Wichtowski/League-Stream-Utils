"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useTournaments } from "@lib/contexts/TournamentsContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/components/modal";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { Tournament, TournamentStatus } from "@/lib/types";
import { TournamentEditor } from "@lib/components/pages/tournaments/TournamentEditor";

interface TournamentDetailPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const router = useRouter();
  const { tournaments, loading: tournamentsLoading, error, refreshTournaments, updateTournament } = useTournaments();
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournamentId, setTournamentId] = useState<string>("");

  useEffect(() => {
    setActiveModule("tournaments");
  }, [setActiveModule]);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTournamentId(resolvedParams.tournamentId);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (tournaments.length > 0 && tournamentId) {
      const foundTournament = tournaments.find((t) => t.id === tournamentId);
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
      <PageWrapper loadingMessage="Loading tournament...">
        <LoadingSpinner fullscreen text="Loading tournament..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      loadingMessage="Loading tournament..."
      breadcrumbs={[
        { label: "Tournaments", href: `/modules/tournaments` },
        { label: tournament.name, href: `/modules/tournaments/${tournamentId}`, isActive: true }
      ]}
      title={tournament.name}
      subtitle={tournament.abbreviation}
    >
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
