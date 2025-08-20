"use client";

import { useEffect, useState, useCallback } from "react";
import type { Sponsorship } from "@lib/types";
import { SponsorWindow } from "@libTournament/components/sponsors";

interface TournamentInfo {
  id: string;
  name: string;
  abbreviation: string;
}

interface SponsorsDisplayData {
  tournament: TournamentInfo;
  sponsors: Sponsorship[];
}

interface SponsorsDisplayPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default function SponsorsDisplayPage({ params }: SponsorsDisplayPageProps) {
  const [data, setData] = useState<SponsorsDisplayData | null>(null);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
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

    // Set up periodic refresh every 30 seconds for OBS display
    const refreshInterval = setInterval(fetchSponsors, 30000);

    return () => clearInterval(refreshInterval);
  }, [fetchSponsors]);

  useEffect(() => {
    if (!data || data.sponsors.length === 0) return;

    const fadeOutDuration = 1000; // 1 second fade out
    const displayDuration = 3000; // 3 seconds display
    const fadeInDuration = 1000; // 1 second fade in
    const totalCycleDuration = fadeOutDuration + displayDuration + fadeInDuration;

    const cycleSponsors = (): void => {
      // Fade out
      setIsVisible(false);

      setTimeout(() => {
        // Change sponsor
        setCurrentSponsorIndex((prev) => (prev + 1) % data.sponsors.length);

        // Fade in
        setTimeout(() => {
          setIsVisible(true);
        }, 50); // Small delay to ensure DOM update
      }, fadeOutDuration);
    };

    const interval = setInterval(cycleSponsors, totalCycleDuration);

    return () => clearInterval(interval);
  }, [data]);

  if (loading) {
    return (
      <div className="fixed bottom-4 left-4 w-64 h-32 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Loading sponsors...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed bottom-4 left-4 w-64 h-32 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-red-400">Error loading sponsors</p>
          <p className="text-sm text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (data.sponsors.length === 0) {
    return (
      <div className="fixed bottom-4 left-4 w-64 h-32 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
        <div className="text-white text-center">
          <p>No sponsors available</p>
        </div>
      </div>
    );
  }

  const currentSponsor = data.sponsors[currentSponsorIndex];

  return <SponsorWindow currentSponsor={currentSponsor} isVisible={isVisible} />;
}
