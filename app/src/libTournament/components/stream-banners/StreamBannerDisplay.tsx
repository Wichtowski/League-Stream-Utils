"use client";

import { useEffect, useState, useCallback } from "react";
import type { StreamBanner, EmbeddedStreamBanner, Tournament } from "@lib/types/tournament";
import type { Match, Team } from "@lib/types";
import { CarouselTicker } from "./CarouselTicker";
import Image from "next/image";

interface StreamBannerDisplayProps {
  tournamentId?: string;
  tournament?: Tournament;
  match?: Match;
  team1?: Team | null;
  team2?: Team | null;
  className?: string;
  refreshInterval?: number; // milliseconds, default 60000 (60 seconds)
  showDebugInfo?: boolean; // whether to show debug info, default false
}

interface DisplayData {
  tournament: {
    _id: string;
    name: string;
    abbreviation: string;
  };
  streamBanner: StreamBanner | EmbeddedStreamBanner;
}

export const StreamBannerDisplay = ({
  tournamentId,
  tournament,
  match,
  team1,
  team2,
  className = "",
  refreshInterval = 60000,
  showDebugInfo = false
}: StreamBannerDisplayProps) => {
  const [displayData, setDisplayData] = useState<DisplayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');

  const banner = displayData?.streamBanner || null

  // Fetch banner data from API (only when using tournamentId mode)
  const fetchBannerData = useCallback(async () => {
    if (!tournamentId) {
      // If tournament data is passed directly, use it
      if (tournament?.streamBanner) {
        setDisplayData({
          tournament: {
            _id: tournament._id,
            name: tournament.name,
            abbreviation: tournament.abbreviation
          },
          streamBanner: tournament.streamBanner
        });
      }
      setIsLoading(false);
      return;
    }

    try {
      setConnectionStatus('reconnecting');
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/stream-banners/display`, {
        // Add cache headers to prevent unnecessary requests
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch banner data: ${response.status}`);
      }

      const data: DisplayData = await response.json();

      // Only update state if data has actually changed
      setDisplayData(prevData => {
        const dataChanged = JSON.stringify(prevData) !== JSON.stringify(data);
        return dataChanged ? data : prevData;
      });

      setError(null);
      setLastFetchTime(Date.now());
      setConnectionStatus('connected');
    } catch (err) {
      console.error("Error fetching banner data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch banner data");
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, tournament]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchBannerData();

    // Only set up interval if refreshInterval is greater than 0
    if (refreshInterval > 0) {
      const interval = setInterval(fetchBannerData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBannerData, refreshInterval]);

  // Get the single banner (first active banner)

  // Error state
  if (error) {
    return (
      <div className={`w-full h-screen bg-transparent flex items-center justify-center ${className}`}>
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-6 text-center">
          <div className="text-red-400 text-lg font-semibold mb-2">Stream Banner Error</div>
          <div className="text-red-300 text-sm">{error}</div>
          <button
            onClick={fetchBannerData}
            className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <></>
    );
  }

  // No banners state
  if (!displayData?.streamBanner) {
    return (
      <div className={`w-full h-screen bg-transparent ${className}`}>
        {/* Empty state - completely transparent for OBS */}
      </div>
    );
  }

  return (
    <>
      <div className={`w-full h-screen bg-transparent relative overflow-hidden ${className}`}>
        {/* Banner Content - Title sticks above carousel */}
        {banner && (
          <div className="absolute bottom-0 left-0 right-0">
            {/* Title directly above carousel - Full width */}
            {banner.title.trim() && (
              <div
                className="w-full backdrop-blur-sm border-t border-gray-600/50"
                style={{
                  backgroundColor: banner.titleBackgroundColor || "#1f2937",
                  animation: "fadeIn 0.5s ease-out"
                }}
              >
                <div className="flex items-center justify-center py-4 px-4 gap-6">
                  {/* Team logos section (only show if we have match data) */}
                  {match && (team1 || team2) && (
                    <div className="flex items-center gap-4">
                      {/* Team 1 Logo */}
                      {team1?.logo && (
                        <div className="flex items-center">
                          <Image
                            src={
                              team1.logo.type === 'url'
                                ? team1.logo.url
                                : team1.logo.type === 'upload'
                                  ? `data:image/${team1.logo.format};base64,${team1.logo.data}`
                                  : '/default-team-logo.svg'
                            }
                            alt={team1.name}
                            width={48}
                            height={48}
                            className="rounded-lg shadow-lg object-cover"
                          />
                        </div>
                      )}

                      {/* VS text */}
                      {team1 && team2 && (
                        <span
                          className="text-lg font-bold tracking-wider drop-shadow-lg"
                          style={{ color: banner.titleTextColor || "#ffffff" }}
                        >
                          VS
                        </span>
                      )}

                      {/* Team 2 Logo */}
                      {team2?.logo && (
                        <div className="flex items-center">
                          <Image
                            src={
                              team2.logo.type === 'url'
                                ? team2.logo.url
                                : team2.logo.type === 'upload'
                                  ? `data:image/${team2.logo.format};base64,${team2.logo.data}`
                                  : '/default-team-logo.svg'
                            }
                            alt={team2.name}
                            width={48}
                            height={48}
                            className="rounded-lg shadow-lg object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  <h1
                    className="font-bold text-center tracking-wide drop-shadow-lg max-w-[60vw] overflow-hidden text-ellipsis text-lg sm:text-xl md:text-2xl lg:text-3xl"
                    style={{
                      color: banner.titleTextColor || "#ffffff"
                    }}
                  >
                    {banner.title}
                  </h1>
                </div>
              </div>
            )}

            {/* Carousel Ticker */}
            {banner.carouselItems.length > 0 && (
              <CarouselTicker
                items={banner.carouselItems}
                speed={banner.carouselSpeed}
                backgroundColor={banner.carouselBackgroundColor}
              />
            )}
          </div>
        )}

        {/* Debug info (visible when showDebugInfo is true or in development) */}
        {(showDebugInfo || process.env.NODE_ENV === 'development') && (
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded px-3 py-2 text-xs text-gray-300 font-mono">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`}></div>
              <span className="capitalize">{connectionStatus}</span>
            </div>
            <div>Tournament: {displayData.tournament.abbreviation}</div>
            <div>Banner: {banner ? 'Active' : 'None'}</div>
            <div>Speed: {banner?.carouselSpeed || 50}px/s</div>
            <div>Items: {banner?.carouselItems.length || 0}</div>
            <div>Last Update: {new Date(lastFetchTime).toLocaleTimeString()}</div>
          </div>
        )}

      </div>
    </>
  );
};