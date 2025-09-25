"use client";

import { useEffect, useState, useCallback } from "react";
import { Ticker, EmbeddedTicker, Tournament, Match } from "@libTournament/types";
import { Team } from "@libTeam/types";
import { CarouselTicker } from "./CarouselTicker";
import { ErrorBoundary } from "@lib/components/common/ErrorBoundary";
import { useErrorHandling } from "@lib/hooks/useErrorHandling";
import { logError as _logError } from "@lib/utils/error-handling";
import Image from "next/image";

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
  refreshInterval = 60000,
  showDebugInfo = false
}: TickerDisplayProps) => {
  const [displayData, setDisplayData] = useState<DisplayData | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  
  const { 
    error, 
    isLoading, 
    executeWithRetry, 
    clearError 
  } = useErrorHandling({ 
    showUserErrors: false, // Don't show user alerts in OBS overlay
    logErrors: true,
    context: { component: 'TickerDisplay', tournamentId }
  });

  const ticker = displayData?.ticker || null

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
      setConnectionStatus('reconnecting');
      
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/ticker/display`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json'
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

    const result = await executeWithRetry(
      fetchData,
      {
        maxAttempts: maxRetries,
        delay: 2000,
        backoff: 'exponential',
        shouldRetry: (error) => {
          // Retry on network errors and server errors, but not on 404 (tournament not found)
          if ('status' in error && error.status === 404) {
            return false;
          }
          return true;
        }
      }
    );

    if (result) {
      // Only update state if data has actually changed
      setDisplayData(prevData => {
        const dataChanged = JSON.stringify(prevData) !== JSON.stringify(result);
        return dataChanged ? result : prevData;
      });

      setLastFetchTime(Date.now());
      setConnectionStatus('connected');
      setRetryCount(0);
      clearError();
    } else {
      setConnectionStatus('disconnected');
      setRetryCount(prev => Math.min(prev + 1, maxRetries));
    }
  }, [tournamentId, tournament, executeWithRetry, maxRetries, clearError]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchTickerData();

    // Only set up interval if refreshInterval is greater than 0
    if (refreshInterval > 0) {
      const interval = setInterval(fetchTickerData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTickerData, refreshInterval]);

  // Get the single ticker (first active ticker)

  // Error state - only show in development or when debug is enabled
  if (error && (showDebugInfo || process.env.NODE_ENV === 'development')) {
    return (
      <div className={`w-full h-screen bg-transparent flex items-center justify-center ${className}`}>
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-6 text-center max-w-md">
          <div className="text-red-400 text-lg font-semibold mb-2">Ticker Connection Error</div>
          <div className="text-red-300 text-sm mb-4">{
            typeof error.message === 'string'
              ? error.message
              : (error.message instanceof Error ? error.message.message : String(error.message ?? ''))
          }</div>
          <div className="text-red-400 text-xs mb-4">
            Retry {retryCount}/{maxRetries} • Last attempt: {new Date(lastFetchTime).toLocaleTimeString()}
          </div>
          <button
            onClick={fetchTickerData}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Retrying...' : 'Retry Now'}
          </button>
        </div>
      </div>
    );
  }

  // In production, gracefully degrade to empty state on error
  if (error && !showDebugInfo && process.env.NODE_ENV === 'production') {
    return (
      <div className={`w-full h-screen bg-transparent ${className}`}>
        {/* Empty state - completely transparent for OBS */}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <></>
    );
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
      showDetails={showDebugInfo || process.env.NODE_ENV === 'development'}
      fallback={
        <div className={`w-full h-screen bg-transparent ${className}`}>
          {/* Fallback to empty state on component error */}
        </div>
      }
    >
      <div className={`w-full h-screen bg-transparent relative overflow-hidden ${className}`}>
        {/* ticker Content - Title sticks above carousel */}
        {ticker && (
          <div className="absolute bottom-0 left-0 right-0">
            {/* Title directly above carousel - Full width */}
            {ticker.title.trim() && (
              <div
                className="w-full backdrop-blur-sm border-t border-gray-600/50"
                style={{
                  backgroundColor: ticker.titleBackgroundColor || "#1f2937",
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
                          style={{ color: ticker.titleTextColor || "#ffffff" }}
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
                      color: ticker.titleTextColor || "#ffffff"
                    }}
                  >
                    {ticker.title}
                  </h1>
                </div>
              </div>
            )}

            {/* Carousel Ticker */}
            {ticker.carouselItems.length > 0 && (
              <CarouselTicker
                items={ticker.carouselItems}
                speed={ticker.carouselSpeed}
                backgroundColor={ticker.carouselBackgroundColor}
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
            <div>ticker: {ticker ? 'Active' : 'None'}</div>
            <div>Speed: {ticker?.carouselSpeed || 50}px/s</div>
            <div>Items: {ticker?.carouselItems.length || 0}</div>
            <div>Last Update: {new Date(lastFetchTime).toLocaleTimeString()}</div>
          </div>
        )}

      </div>
    </ErrorBoundary>
  );
};