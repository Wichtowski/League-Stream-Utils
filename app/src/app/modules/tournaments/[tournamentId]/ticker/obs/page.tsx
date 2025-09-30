"use client";

import { TickerDisplay } from "@libTournament/components/ticker";
import { useParams, useSearchParams } from "next/navigation";

export default function OBSTickerPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const displayInfo = useSearchParams().get("displayInfo");

  // Parse query parameters with defaults
  const showDebugInfo = displayInfo?.toLowerCase() === "true";

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden">
      <TickerDisplay
        tournamentId={tournamentId}
        showDebugInfo={showDebugInfo}
        className="w-full h-full"
      />
    </div>
  );
}
