"use client";

import { useCallback, useEffect, useState } from "react";
import type { Sponsorship } from "@libTournament/types";
import { SponsorWindow } from "@libTournament/components/sponsors";
import { useParams } from "next/navigation";

interface TournamentInfo {
  id: string;
  name: string;
  abbreviation: string;
}

interface SponsorsDisplayData {
  tournament: TournamentInfo;
  sponsors: Sponsorship[];
}

export default function SponsorsCornerOBSPage(): React.ReactElement {
  const [data, setData] = useState<SponsorsDisplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const tournamentId = params.tournamentId as string;

  const fetchSponsors = useCallback(async (): Promise<void> => {
    if (!tournamentId) return;

    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/sponsors/display`);
      if (!response.ok) {
        throw new Error("Failed to fetch sponsors");
      }
      const sponsorsData = await response.json();
      setData(sponsorsData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sponsors");
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchSponsors();

    const refreshInterval = setInterval(fetchSponsors, 30000);
    return () => clearInterval(refreshInterval);
  }, [fetchSponsors]);

  // Cycling handled by SponsorWindow component

  if (loading || error || !data || data.sponsors.length === 0) {
    return <></>;
  }

  return <SponsorWindow sponsors={data.sponsors} variant="corner" />;
}
