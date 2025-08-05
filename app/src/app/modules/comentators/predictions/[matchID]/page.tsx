"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@lib/contexts/AuthContext";
import { AuthGuard } from "@lib/components/auth/AuthGuard";
import { BackButton } from "@lib/components/common/buttons";

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  startTime: string;
  tournament?: string;
}

interface ComentatorPredictionsMatchPageProps {
  params: Promise<{
    matchID: string;
  }>;
}

export default function ComentatorPredictionsMatchPage({
  params,
}: ComentatorPredictionsMatchPageProps): React.ReactElement {
  const user = useUser();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchID, setMatchID] = useState<string>("");

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setMatchID(resolvedParams.matchID);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!matchID) return;

    const fetchMatch = async () => {
      try {
        setLoading(true);
        // For now, we'll use mock data since this is a quick match
        // In a real implementation, you'd fetch from an API
        const mockMatch: Match = {
          id: matchID,
          teamA: "Team Alpha",
          teamB: "Team Beta",
          startTime: new Date().toISOString(),
          tournament: "Quick Match",
        };
        setMatch(mockMatch);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch match");
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchID]);

  if (!user) {
    return <AuthGuard>{null}</AuthGuard>;
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-white">Loading match predictions...</div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !match) {
    return (
      <AuthGuard>
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
          <BackButton to="/modules/comentators/predictions" />
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">Error loading match</div>
            <p className="text-gray-500">{error || "Match not found"}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Comentator Predictions
            </h1>
            <p className="text-gray-400 mt-2">
              {match.tournament
                ? `Tournament: ${match.tournament}`
                : "Quick Match"}
            </p>
          </div>
          <BackButton to="/modules/comentators/predictions" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main match info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match header */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {match.teamA.split(" ")[1] || "A"}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {match.teamA}
                    </h2>
                    <p className="text-gray-400 text-sm">Blue Team</p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-white">VS</div>
                  <div className="text-sm text-gray-400">Best of 3</div>
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white text-right">
                      {match.teamB}
                    </h2>
                    <p className="text-gray-400 text-sm text-right">Red Team</p>
                  </div>
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {match.teamB.split(" ")[1] || "B"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center text-gray-400">
                {match.startTime
                  ? new Date(match.startTime).toLocaleString()
                  : "TBD"}
              </div>
            </div>

            {/* Predictions section */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                Comentator Predictions
              </h3>
              <div className="text-gray-400 text-center py-8">
                <p>Prediction functionality coming soon...</p>
                <p className="text-sm mt-2">
                  Comentators will be able to make predictions for this match.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Match Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Match ID:</span>
                  <span className="text-white">{match.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Format:</span>
                  <span className="text-white">Best of 3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400">Scheduled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
