'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useTournaments } from '@lib/contexts/TournamentsContext';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useModal } from '@lib/components/modal';
import { AuthGuard } from '@lib/components/auth/AuthGuard';
import { LoadingSpinner } from '@lib/components/common';
import { BackButton } from '@/lib/components/common/buttons';
import { Tournament } from '@/lib/types/tournament';

// Dynamic imports for lazy loading
const SponsorManager = dynamic(
  () => import('@lib/components/pages/tournaments').then(mod => ({ default: mod.SponsorManager })),
  { 
    loading: () => <LoadingSpinner text="Loading sponsor manager..." />,
    ssr: false 
  }
);

interface TournamentSponsorsPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default function TournamentSponsorsPage({ params }: TournamentSponsorsPageProps) {
  const { tournaments, loading: tournamentsLoading, error, refreshTournaments } = useTournaments();
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const [tournament, setTournament] = useState<Tournament>();
  const [loading, setLoading] = useState(true);
  const [tournamentId, setTournamentId] = useState<string>('');

  useEffect(() => {
    setActiveModule('tournaments');
  }, [setActiveModule]);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTournamentId(resolvedParams.tournamentId);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!tournamentsLoading && tournaments.length > 0 && tournamentId) {
      const foundTournament = tournaments.find(t => t.id === tournamentId);
      if (foundTournament) {
        setTournament(foundTournament);
      }
      setLoading(false);
    }
  }, [tournaments, tournamentsLoading, tournamentId]);

  useEffect(() => {
    if (error) {
      showAlert({ type: 'error', message: error });
    }
  }, [error, showAlert]);

  if (loading || tournamentsLoading) {
    return (
      <AuthGuard loadingMessage="Loading tournament...">
        <LoadingSpinner fullscreen text="Loading tournament..." />
      </AuthGuard>
    );
  }

  if (!tournament) {
    return (
      <AuthGuard loadingMessage="Loading tournament...">
        <div className="min-h-screen text-white">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-4">
              <BackButton to="/modules/tournaments">Back to Tournaments</BackButton>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
              <p>The tournament you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard loadingMessage="Loading sponsors...">
      <div className="min-h-screen text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-4">
            <BackButton to="/modules/tournaments">Back to Tournaments</BackButton>
          </div>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Tournament Sponsors</h1>
            <p className="text-gray-300">{tournament.name} ({tournament.abbreviation})</p>
          </div>

          <Suspense fallback={<LoadingSpinner text="Loading sponsor manager..." />}>
            <SponsorManager 
              tournamentId={tournamentId}
              tournament={tournament}
              onSponsorsUpdated={() => refreshTournaments()}
            />
          </Suspense>
        </div>
      </div>
    </AuthGuard>
  );
} 