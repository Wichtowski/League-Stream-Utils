"use client";

import { TickerDisplay } from "@libTournament/components/ticker";
import { useParams, useSearchParams } from "next/navigation";

export default function OBSTickerPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const refresh = useSearchParams().get("refresh");
  const displayInfo = useSearchParams().get("displayInfo");

  // Parse query parameters with defaults
  const refreshInterval = refresh ? parseInt(refresh) * 1000 : 60000; // Default 60 seconds
  const showDebugInfo = displayInfo?.toLowerCase() === "true";

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
