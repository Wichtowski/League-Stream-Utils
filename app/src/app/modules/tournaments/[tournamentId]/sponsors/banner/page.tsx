"use client";

import { useEffect, useState, useCallback } from "react";
import type { Sponsorship } from "@libTournament/types";
import { SponsorBannerWindow } from "@libTournament/components/sponsors";
import { useParams } from "next/navigation";

export default function SponsorsBannerPreviewPage() {
  const [sponsors, setSponsors] = useState<Sponsorship[]>([]);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const params = useParams();
  const tournamentId = params.tournamentId as string;

  const fetchSponsors = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/sponsors`);
      if (!response.ok) {
        throw new Error("Failed to fetch sponsors");
      }
      const data = await response.json();
      setSponsors(data.sponsors || []);
    } catch {
      // ignore in preview
    }
  }, [tournamentId]);

  useEffect(() => {
    if (!tournamentId) return;
    fetchSponsors();
  }, [fetchSponsors, tournamentId]);

  useEffect(() => {
    if (sponsors.length === 0) return;

    const fadeOutDuration = 1000;
    let timeoutId: NodeJS.Timeout | null = null;

    const runCycle = (index: number): void => {
      const current = sponsors[index];
      const displaySeconds = Math.max(1, current.timeInSeconds ?? 3);
      const displayDuration = displaySeconds * 1000;

      setIsVisible(true);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentSponsorIndex((prev) => {
            const next = (prev + 1) % sponsors.length;
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
  }, [sponsors, currentSponsorIndex]);

  if (sponsors.length === 0) return <></>;
  const currentSponsor = sponsors[currentSponsorIndex];
  return (
    <div className="p-6">
      <SponsorBannerWindow currentSponsor={currentSponsor} isVisible={isVisible} fixed={false} />
    </div>
  );
}
