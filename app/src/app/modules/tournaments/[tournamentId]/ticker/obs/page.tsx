"use client";

import { TickerDisplay } from "@/libTournament/components/ticker";
import { use } from "react";

interface PageProps {
  params: Promise<{
    tournamentId: string;
  }>;
  searchParams: Promise<{
    refresh?: string;
    displayInfo?: string;
  }>;
}

export default function OBSTickerPage({ params, searchParams }: PageProps) {
  const { tournamentId } = use(params);
  const { refresh, displayInfo } = use(searchParams);

  // Parse query parameters with defaults
  const refreshInterval = refresh ? parseInt(refresh) * 1000 : 60000; // Default 60 seconds
  const showDebugInfo = displayInfo?.toLowerCase() === 'true';

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden">
      <TickerDisplay
        tournamentId={tournamentId}
        refreshInterval={refreshInterval}
        showDebugInfo={showDebugInfo}
        className="w-full h-full"
      />
    </div>
  );
}