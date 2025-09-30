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

export default function SponsorsCornerOBSPage() {
  const [data, setData] = useState<SponsorsDisplayData | null>(null);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
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

  useEffect(() => {
    if (!data || data.sponsors.length === 0) return;

    const fadeOutDuration = 1000;
    let timeoutId: NodeJS.Timeout | null = null;

    const runCycle = (index: number): void => {
      const current = data.sponsors[index];
      const displaySeconds = Math.max(1, current.timeInSeconds ?? 3);
      const displayDuration = displaySeconds * 1000;

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setTimeout(() => {
          setCurrentSponsorIndex((prev) => {
            const next = (prev + 1) % data.sponsors.length;
            setTimeout(() => runCycle(next), 50);
            return next;
          });
        }, fadeOutDuration);
      }, displayDuration);
    };

    runCycle(currentSponsorIndex);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [data, currentSponsorIndex]);

  if (loading || error || !data || data.sponsors.length === 0) {
    return <></>;
  }

  const currentSponsor = data.sponsors[currentSponsorIndex];
  return <SponsorWindow currentSponsor={currentSponsor} variant="corner" />;
}