"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Ticker, EmbeddedTicker, Tournament, Match } from "@libTournament/types";
import type { Sponsorship } from "@libTournament/types/sponsors";
import { Team } from "@libTeam/types";
import { getImageSrc } from "@lib/services/common/image";
import { CarouselTicker } from "./CarouselTicker";
import { SponsorWithinTicker } from "./SponsorWithinTicker";
import { motion } from "framer-motion";
import type React from "react";
import { ErrorBoundary } from "@lib/components/common/ErrorBoundary";
import { useErrorHandling } from "@lib/hooks/useErrorHandling";
import { SafeImage } from "@lib/components/common/SafeImage";

interface TickerDisplayProps {
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
  ticker: Ticker | EmbeddedTicker;
}

export const TickerDisplay = ({
  tournamentId,
  tournament,
  match,
  team1,
  team2,
  className = "",
  showDebugInfo = false
}: TickerDisplayProps): React.ReactElement => {
  
  const [displayData, setDisplayData] = useState<DisplayData | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const [sponsors, setSponsors] = useState<Sponsorship[]>([]);

  const errorContext = useMemo(() => ({ component: "TickerDisplay", tournamentId }), [tournamentId]);
  const { error, isLoading, executeWithRetry, clearError } = useErrorHandling({
    showUserErrors: false,
    logErrors: true,
    context: errorContext
  });

  const ticker = displayData?.ticker || null;

  // Fetch ticker data from API (only when using tournamentId mode)
  const fetchTickerData = useCallback(async () => {
    if (!tournamentId) {
      // If tournament data is passed directly, use it
      if (tournament?.ticker) {
        setDisplayData({
          tournament: {
            _id: tournament._id,
            name: tournament.name,
            abbreviation: tournament.abbreviation
          },
          ticker: tournament.ticker
        });
      }
      return;
    }

    const fetchData = async (): Promise<DisplayData> => {

      const response = await fetch(`/api/v1/tournaments/${tournamentId}/ticker/display`, {
        headers: {
          "Cache-Control": "no-cache",
          Accept: "application/json"
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: DisplayData = await response.json();
      return data;
    };

    const result = await executeWithRetry(fetchData, {
      maxAttempts: maxRetries,
      delay: 2000,
      backoff: "exponential",
      shouldRetry: (error) => {
        // Retry on network errors and server errors, but not on 404 (tournament not found)
        if ("status" in error && error.status === 404) {
          return false;
        }
        return true;
      }
    });

    if (result) {
      // Only update state if data has actually changed
      setDisplayData((prevData) => {
        const dataChanged = JSON.stringify(prevData) !== JSON.stringify(result);
        return dataChanged ? result : prevData;
      });

      setLastFetchTime(Date.now());
      setRetryCount(0);
      clearError();
    } else {
      setRetryCount((prev) => Math.min(prev + 1, maxRetries));
    }
  }, [tournamentId, tournament, executeWithRetry, maxRetries, clearError]);

  useEffect(() => {
    fetchTickerData();
  }, [fetchTickerData]);

  useEffect(() => {
    const fetchSponsors = async (): Promise<void> => {
      try {
        const id = tournamentId || tournament?._id;
        if (!id) return;
        const resp = await fetch(`/api/v1/tournaments/${id}/sponsors/display`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000)
        });
        if (!resp.ok) return;
        const data: { sponsors: Sponsorship[] } = await resp.json();
        setSponsors(Array.isArray(data.sponsors) ? data.sponsors : []);
      } catch {
        setSponsors([]);
      }
    };

    void fetchSponsors();
  }, [tournamentId, tournament]);

  // Error state - only show in development or when debug is enabled
  if (error && (showDebugInfo || process.env.NODE_ENV === "development")) {
    return (
      <div className={`w-full h-screen bg-transparent flex items-center justify-center ${className}`}>
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-6 text-center max-w-md">
          <div className="text-red-400 text-lg font-semibold mb-2">Ticker Connection Error</div>
          <div className="text-red-300 text-sm mb-4">
            {typeof error.message === "string"
              ? error.message
              : error.message instanceof Error
                ? error.message.message
                : String(error.message ?? "")}
          </div>
          <div className="text-red-400 text-xs mb-4">
            Retry {retryCount}/{maxRetries} • Last attempt: {new Date(lastFetchTime).toLocaleTimeString()}
          </div>
          <button
            onClick={fetchTickerData}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? "Retrying..." : "Retry Now"}
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <></>;
  }

  // No tickers state
  if (!displayData?.ticker) {
    return (
      <div className={`w-full h-screen bg-transparent ${className}`}>
        {/* Empty state - completely transparent for OBS */}
      </div>
    );
  }

  return (
    <ErrorBoundary
      context="TickerDisplay"
      showDetails={showDebugInfo || process.env.NODE_ENV === "development"}
      fallback={
        <div className={`w-full h-screen bg-transparent ${className}`}>
          {/* Fallback to empty state on component error */}
        </div>
      }
    >
      <div className={`${className}`}>
        {/* ticker Content - Title sticks above carousel */}
        {ticker && (
          <motion.div
            className="fixed bottom-0 left-0 right-0"
            initial={{ y: 64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            style={{ willChange: "transform", marginLeft: "24px", marginRight: "24px", marginBottom: "64px" }}
          >
            {/* Title directly above carousel - Full width */}
            {ticker.title.trim() && (
              <div
                className="w-full"
                style={{
                  backgroundColor: ticker.titleBackgroundColor || "#1f2937"
                }}
              >
                {(() => {
                  const hasImages = Boolean(match && (team1 || team2));
                  if (hasImages) {
                    return (
                      <div className="flex items-stretch justify-start h-32">
                        {/* Left: Images */}
                        <div className="flex items-center">
                          {team1?.logo && (
                            <div className="bg-black h-full">
                              <div className="relative w-32 h-32 overflow-hidden">
                                <SafeImage
                                  src={getImageSrc(team1.logo)}
                                  alt={team1.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </div>
                          )}
                          {team1 && team2 && match && (
                            <div className="flex items-center h-full bg-black w-[72px]">
                              <div className="h-full flex flex-col items-center justify-center w-full">
                                <div className="text-4xl font-bold tracking-wider text-white w-full h-full flex items-end justify-center">VS</div>
                                <div className="text-xl font-bold tracking-wider text-white w-full h-full flex items-center justify-center">{match.format}</div>
                              </div>
                            </div>
                          )}
                          {team2?.logo && (
                            <div className="bg-black h-full">
                              <div className="relative w-32 h-32 overflow-clip">
                                <SafeImage
                                  src={getImageSrc(team2.logo)}
                                  alt={team2.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Center: Title/Carousel (left) + Sponsors (right spanning two rows) */}
                        <div className="flex h-full w-full">
                          <div className="flex flex-col justify-between h-full" style={{ width: '1288px' }}>
                            <div className="h-[70%] flex items-center">
                              <h1
                                className="ml-4 font-bold text-left tracking-wide max-w-[100vw] overflow-hidden text-ellipsis text-lg sm:text-xl md:text-2xl lg:text-4xl"
                                style={{ color: ticker.titleTextColor || "#ffffff" }}
                              >
                                {ticker.title}
                              </h1>
                            </div>
                            <div className="h-[30%] flex items-center w-full overflow-hidden">
                              {ticker.carouselItems.length > 0 && (
                                <div className="w-full mr-6" style={{ width: 'calc(100% + 24px)' }}>
                                  <CarouselTicker
                                    items={ticker.carouselItems}
                                    speed={ticker.carouselSpeed}
                                    backgroundColor={ticker.carouselBackgroundColor}
                                  />
                                </div>
                              )}
                            </div>
                          </div> 
                        </div>

                        {/* Sponsors - right */}
                        <div className="flex w-[256px] h-[128px]">
                          <SponsorWithinTicker sponsors={sponsors} />
                        </div>
                      </div>
                    );
                  }

                  // Fallback: No images, keep original title-only row
                  return (
                    <div className="flex items-start justify-start py-4 px-4 gap-6">
                      <h1
                        className="font-bold text-left tracking-wide max-w-[100vw] overflow-hidden text-ellipsis text-lg sm:text-xl md:text-2xl lg:text-4xl"
                        style={{ color: ticker.titleTextColor || "#ffffff" }}
                      >
                        {ticker.title}
                      </h1>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Carousel Ticker */}
            {(() => {
              const hasImages = Boolean(match && (team1 || team2));
              if (hasImages) return null; // When images exist, carousel is shown under title at right
              return (
                ticker.carouselItems.length > 0 && (
                  <div className="w-full mr-6" style={{ width: 'calc(100% + 24px)' }}>
                    <CarouselTicker
                      items={ticker.carouselItems}
                      speed={ticker.carouselSpeed}
                      backgroundColor={ticker.carouselBackgroundColor}
                    />
                  </div>
                )
              );
            })()}
          </motion.div>
        )}
      </div>
    </ErrorBoundary>
  );
};
