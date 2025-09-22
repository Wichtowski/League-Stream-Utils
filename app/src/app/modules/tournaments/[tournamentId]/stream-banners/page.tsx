"use client";

import { useEffect, useState, useCallback } from "react";
import { useTournaments } from "@libTournament/contexts/TournamentsContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { LoadingSpinner } from "@lib/components/common";
import { Tournament, StreamBanner } from "@lib/types/tournament";
import { StreamBannerFormData } from "@lib/types/forms";
import {
  OBSDisplayInfo,
  StreamBannerManager,
  StreamBannerPreview
} from "@libTournament/components/stream-banners";
import { PageWrapper } from "@lib/layout";

interface TournamentStreamBannerPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default function TournamentStreamBannerPage({ params }: TournamentStreamBannerPageProps) {
  const { tournaments, loading: tournamentsLoading, error, refreshTournaments } = useTournaments();
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const [tournament, setTournament] = useState<Tournament>();
  const [loading, setLoading] = useState(true);
  const [tournamentId, setTournamentId] = useState<string>("");

  // Stream banner management state
  const [banner, setBanner] = useState<StreamBanner | null>(null);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [previewBanner, setPreviewBanner] = useState<StreamBannerFormData | null>(null);

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

  const fetchBanner = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/stream-banners`);
      if (!response.ok) {
        throw new Error("Failed to fetch stream banner");
      }
      const data = await response.json();
      setBanner(data.streamBanner || null);
      setBannerLoading(false);
    } catch (_error) {
      await showAlert({
        type: "error",
        message: "Failed to load stream banner"
      });
      setBannerLoading(false);
    }
  }, [tournamentId, showAlert]);

  useEffect(() => {
    if (tournamentId) {
      fetchBanner();
    }
  }, [fetchBanner, tournamentId]);

  const handleBannerUpdated = (): void => {
    fetchBanner();
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
          { label: "Stream Banner", href: `/modules/tournaments/${tournamentId}/stream-banners`, isActive: true }
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
        { label: "Stream Banner", href: `/modules/tournaments/${tournamentId}/stream-banners`, isActive: true }
      ]}
      title="Stream Banner Management"
      subtitle={`${tournament.name} (${tournament.abbreviation})`}
    >
      <div className="space-y-6">
        <div className="flex gap-6">
          {/* Live Preview Section */}
          <div className="flex-1 bg-gray-800 rounded-lg p-6 h-[400px] flex flex-col">
            <div className="flex-1 flex flex-col justify-center items-center">
              {banner ? (
                <div className="text-center w-full">
                  <div className="relative w-full max-w-2xl mx-auto">
                    <StreamBannerPreview
                      formData={{
                        title: banner.title,
                        titleBackgroundColor: banner.titleBackgroundColor || "#1f2937",
                        titleTextColor: banner.titleTextColor || "#ffffff",
                        carouselItems: (banner.carouselItems || []).map(item => ({
                          text: item.text,
                          backgroundColor: item.backgroundColor || "#1f2937",
                          textColor: item.textColor || "#ffffff",
                          order: item.order
                        })),
                        carouselSpeed: banner.carouselSpeed,
                        carouselBackgroundColor: banner.carouselBackgroundColor || "#1f2937",
                      }}
                      autoPlay={true}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">📺</div>
                  <p className="text-lg font-medium">
                    {banner ? "Stream banner is inactive" : "No stream banner"}
                  </p>
                  <p className="text-sm">
                    {banner ? "Activate your banner to see the live preview" : "Create a stream banner to see the live preview"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info and Controls Section */}
          <div className="flex-1 space-y-6">
            {/* OBS Display Info */}
            <OBSDisplayInfo tournamentId={tournamentId} />

            {/* Banner Status */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Banner Status</h3>
              <div className="text-sm">
                {banner ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Title:</span>
                      <span className="text-white">{banner.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Carousel Items:</span>
                      <span className="text-white">{banner.carouselItems?.length || 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <p>No stream banner configured</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stream Banner Manager */}
        <StreamBannerManager
          tournamentId={tournamentId}
          tournament={tournament}
          banner={banner}
          bannerLoading={bannerLoading}
          onBannerUpdated={handleBannerUpdated}
          onPreviewChange={setPreviewBanner}
        />
      </div>
    </PageWrapper>
  );
}