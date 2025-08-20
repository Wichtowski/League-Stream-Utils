"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Tournament, BracketStructure } from "@lib/types/tournament";
import type { Match } from "@lib/types/match";
import { useUser } from "@lib/contexts";
import { PageWrapper } from "@lib/layout";
import { MatchCreationForm } from "@libTournament/components";
import { LoadingSpinner } from "@lib/components/common";

interface CreateMatchPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default function CreateMatchPage({ params }: CreateMatchPageProps): React.ReactElement {
  const user = useUser();
  const router = useRouter();

  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracketStructure, setBracketStructure] = useState<BracketStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string>("");

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTournamentId(resolvedParams.tournamentId);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!tournamentId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch tournament data
        const tournamentResponse = await fetch(`/api/v1/tournaments/${tournamentId}`);
        if (!tournamentResponse.ok) {
          throw new Error("Failed to fetch tournament");
        }
        const tournamentData = await tournamentResponse.json();
        setTournament(tournamentData.tournament);

        // Check if user is tournament organizer
        if (tournamentData.tournament.userId !== user?.id && !user?.isAdmin) {
          setError("You don't have permission to create matches for this tournament");
          return;
        }

        // Fetch bracket structure if it exists
        try {
          const bracketResponse = await fetch(`/api/v1/tournaments/${tournamentId}/bracket`);
          if (bracketResponse.ok) {
            const bracketData = await bracketResponse.json();
            setBracketStructure(bracketData.bracket);
          }
        } catch (bracketError) {
          // Bracket might not exist yet, which is fine
          console.debug("No bracket found for tournament:", bracketError);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournamentId, user?.id, user?.isAdmin]);

  const handleMatchCreated = (_match: Match) => {
    // Optionally redirect to the match page or refresh the page
    router.push(`/modules/tournaments/${tournamentId}/matches`);
  };

  if (!user) {
    return <PageWrapper requireAuth={true}>{null}</PageWrapper>;
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <LoadingSpinner />
            <div className="text-white mt-4">Loading tournament data...</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Tournaments", href: "/modules/tournaments" },
          { label: "Matches", href: `/modules/tournaments/${tournamentId}/matches`, isActive: true }
        ]}
      >
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">{error}</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!tournament) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Tournaments", href: "/modules/tournaments" },
          { label: "Matches", href: `/modules/tournaments/${tournamentId}/matches`, isActive: true }
        ]}
      >
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
            <div className="text-center py-12">
                <div className="text-red-400 text-lg mb-4">Tournament not found</div>
            </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: "Matches", href: `/modules/tournaments/${tournamentId}/matches`, isActive: true }
      ]}
    >
      <div className="min-h-screen p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mt-4">
            Create Match - {tournament.name}
          </h1>
          <p className="text-gray-400 mt-2">
            Create a new match for this tournament. You can create matches manually or from existing bracket nodes.
          </p>
        </div>

        <MatchCreationForm
          tournament={tournament}
          bracketNodes={bracketStructure?.nodes}
          onMatchCreated={handleMatchCreated}
        />
      </div>
    </PageWrapper>
  );
}
