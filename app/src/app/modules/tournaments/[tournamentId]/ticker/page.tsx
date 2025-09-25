"use client";

import { useEffect, useState, useCallback } from "react";
import { useTournaments } from "@libTournament/contexts/TournamentsContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { LoadingSpinner } from "@lib/components/common";
import { Tournament } from "@libTournament/types";
import { TickerFormData, Ticker } from "@libTournament/types";
import {
  OBSDisplayInfo,
  TickerManager,
  TickerPreview
} from "@libTournament/components/ticker";
import { PageWrapper } from "@lib/layout";
import { useParams } from "next/navigation";

export default function TournamentTickerPage() {
  const { tournaments, loading: tournamentsLoading, error, refreshTournaments } = useTournaments();
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const [tournament, setTournament] = useState<Tournament>();
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const tournamentId = params.tournamentId as string;

  // Ticker management state
  const [Ticker, setTicker] = useState<Ticker | null>(null);
  const [TickerLoading, setTickerLoading] = useState(true);
  const [, setPreviewTicker] = useState<TickerFormData | null>(null);

  useEffect(() => {
    setActiveModule("tournaments");
  }, [setActiveModule]);

  useEffect(() => {
    if (!tournamentsLoading && tournaments.length > 0 && tournamentId) {
      const foundTournament = tournaments.find((t) => t._id === tournamentId);
      if (foundTournament) {
        setTournament(foundTournament);
      }
      setLoading(false);
    }
  }, [tournaments, tournamentsLoading, tournamentId]);

  useEffect(() => {
    if (error) {
      showAlert({ type: "error", message: error });
    }
  }, [error, showAlert]);

  const fetchTicker = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/ticker`);
      if (!response.ok) {
        throw new Error("Failed to fetch Ticker");
      }
      const data = await response.json();
      setTicker(data.ticker || null);
      setTickerLoading(false);
    } catch (_error) {
      await showAlert({
        type: "error",
        message: "Failed to load Ticker"
      });
      setTickerLoading(false);
    }
  }, [tournamentId, showAlert]);

  useEffect(() => {
    if (tournamentId) {
      fetchTicker();
    }
  }, [fetchTicker, tournamentId]);

  const handleTickerUpdated = (): void => {
    fetchTicker();
    refreshTournaments();
  };

  if (loading || tournamentsLoading) {
    return (
      <PageWrapper>
        <LoadingSpinner fullscreen text="Loading tournament..." />
      </PageWrapper>
    );
  }

  if (!tournament) {
    return (
      <PageWrapper
        title="Tournament Not Found"
        breadcrumbs={[
          { label: "Tournaments", href: `/modules/tournaments` },
          { label: "Ticker", href: `/modules/tournaments/${tournamentId}/ticker`, isActive: true }
        ]}
      >
        <div className="text-center">
          <p>The tournament you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Tournaments", href: `/modules/tournaments` },
        { label: tournament.name, href: `/modules/tournaments/${tournamentId}` },
        { label: "Ticker", href: `/modules/tournaments/${tournamentId}/ticker`, isActive: true }
      ]}
      title="Ticker Management"
      subtitle={`${tournament.name} (${tournament.abbreviation})`}
    >
      <div className="space-y-6">
        <div className="flex gap-6">
          {/* Live Preview Section */}
          <div className="flex-1 bg-gray-800 rounded-lg p-6 h-[400px] flex flex-col">
            <div className="flex-1 flex flex-col justify-center items-center">
              {Ticker ? (
                <div className="text-center w-full">
                  <div className="relative w-full max-w-2xl mx-auto">
                    <TickerPreview
                      formData={{
                        title: Ticker.title,
                        titleBackgroundColor: Ticker.titleBackgroundColor || "#1f2937",
                        titleTextColor: Ticker.titleTextColor || "#ffffff",
                        carouselItems: (Ticker.carouselItems || []).map(item => ({
                          text: item.text,
                          backgroundColor: item.backgroundColor || "#1f2937",
                          textColor: item.textColor || "#ffffff",
                          order: item.order
                        })),
                        carouselSpeed: Ticker.carouselSpeed,
                        carouselBackgroundColor: Ticker.carouselBackgroundColor || "#1f2937",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">📺</div>
                  <p className="text-lg font-medium">
                    {Ticker ? "Ticker is inactive" : "No Ticker"}
                  </p>
                  <p className="text-sm">
                    {Ticker ? "Activate your Ticker to see the live preview" : "Create a Ticker to see the live preview"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info and Controls Section */}
          <div className="flex-1 space-y-6">
            {/* OBS Display Info */}
            <OBSDisplayInfo tournamentId={tournamentId} />

            {/* Ticker Status */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Ticker Status</h3>
              <div className="text-sm">
                {Ticker ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Title:</span>
                      <span className="text-white">{Ticker.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Carousel Items:</span>
                      <span className="text-white">{Ticker.carouselItems?.length || 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <p>No Ticker configured</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ticker Manager */}
        <TickerManager
          tournamentId={tournamentId}
          tournament={tournament}
          ticker={Ticker}
          tickerLoading={TickerLoading}
          onTickerUpdated={handleTickerUpdated}
          onPreviewChange={setPreviewTicker}
        />
      </div>
    </PageWrapper>
  );
}