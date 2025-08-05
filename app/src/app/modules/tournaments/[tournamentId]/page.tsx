"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@lib/contexts/AuthContext";
import { useTournaments } from "@lib/contexts/TournamentsContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/components/modal";
import { AuthGuard } from "@lib/components/auth/AuthGuard";
import { LoadingSpinner } from "@lib/components/common";
import { BackButton } from "@/lib/components/common/buttons";
import type { Tournament, TournamentStatus } from "@lib/types";
import dynamic from "next/dynamic";

// Dynamic imports for lazy loading
const TournamentEditor = dynamic(
  () =>
    import("@lib/components/pages/tournaments").then((mod) => ({
      default: mod.TournamentEditor,
    })),
  {
    loading: () => <LoadingSpinner text="Loading tournament editor..." />,
    ssr: false,
  },
);

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const {
    tournaments,
    loading: tournamentsLoading,
    error,
    refreshTournaments,
    updateTournament,
  } = useTournaments();
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const [tournament, setTournament] = useState<Tournament | null>(null);

  const tournamentId = params.tournamentId as string;

  useEffect(() => {
    setActiveModule("tournaments");
  }, [setActiveModule]);

  useEffect(() => {
    if (tournaments.length > 0 && tournamentId) {
      const foundTournament = tournaments.find((t) => t.id === tournamentId);
      if (foundTournament) {
        setTournament(foundTournament);
      } else {
        showAlert({
          type: "error",
          message: "Tournament not found",
        });
        router.push("/modules/tournaments");
      }
    }
  }, [tournaments, tournamentId, showAlert, router]);

  const handleTournamentUpdated = (): void => {
    refreshTournaments();
  };

  const updateTournamentStatus = async (
    tournamentId: string,
    status: TournamentStatus,
  ): Promise<void> => {
    try {
      const result = await updateTournament(tournamentId, { status });
      if (!result.success) {
        await showAlert({
          type: "error",
          message: result.error || "Failed to update tournament status",
        });
      } else {
        refreshTournaments();
      }
    } catch (error) {
      await showAlert({
        type: "error",
        message: "Failed to update tournament status",
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
      <AuthGuard loadingMessage="Loading tournament...">
        <div className="mb-4">
          <BackButton to="/modules/tournaments">Back to Tournaments</BackButton>
        </div>
        <LoadingSpinner fullscreen text="Loading tournament..." />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard loadingMessage="Loading tournament...">
      <div className="mb-4">
        <BackButton to="/modules/tournaments">Back to Tournaments</BackButton>
      </div>
      <div className="min-h-screen text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">{tournament.name}</h1>
              <p className="text-gray-400">{tournament.abbreviation}</p>
            </div>
            <div className="flex items-center space-x-4">
              {user?.isAdmin && (
                <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm">
                  Admin
                </span>
              )}
            </div>
          </div>
          <Suspense
            fallback={<LoadingSpinner text="Loading tournament editor..." />}
          >
            <TournamentEditor
              tournament={tournament}
              onStatusUpdate={updateTournamentStatus}
              onTournamentUpdate={handleTournamentUpdated}
            />
          </Suspense>
        </div>
      </div>
    </AuthGuard>
  );
}
