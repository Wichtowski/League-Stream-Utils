"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageWrapper } from "@lib/layout";
import { LoadingSpinner, Button } from "@lib/components/common";
import type { MatchPrediction, Commentator } from "@libTournament/types";
import { useCurrentTournament } from "@libTournament/contexts/CurrentTournamentContext";
import { useCurrentMatch } from "@libTournament/contexts/CurrentMatchContext";

export default function MatchPredictionsPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const matchId = params.matchId as string;

  const { currentMatch, setCurrentMatch } = useCurrentMatch();
  const { currentTournament, setCurrentTournament } = useCurrentTournament();
  const [loading, setLoading] = useState<boolean>(true);
  const [commentators, setCommentators] = useState<Commentator[]>([]);
  const [selectedCommentator, setSelectedCommentator] = useState<string>("");
  const [scoreBlue, setScoreBlue] = useState<number>(0);
  const [scoreRed, setScoreRed] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const pageProps = useMemo(() => {
    return {
      title: currentMatch ? `Predictions • ${currentMatch.name}` : loading ? "Loading match..." : "Match not found",
      subtitle: currentTournament ? `${currentTournament.name} (${currentTournament.abbreviation})` : "",
      breadcrumbs: [
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: currentTournament?.name || "Tournament", href: `/modules/tournaments/${tournamentId}` },
        { label: "Matches", href: `/modules/tournaments/${tournamentId}/matches` },
        { label: currentMatch?.name || "Match", href: `/modules/tournaments/${tournamentId}/matches/${matchId}` },
        {
          label: "Predictions",
          href: `/modules/tournaments/${tournamentId}/matches/${matchId}/predictions`,
          isActive: true
        }
      ]
    };
  }, [currentMatch, currentTournament, tournamentId, matchId, loading]);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      if (!tournamentId || !matchId) return;
      setLoading(true);
      try {
        const [matchRes, tournamentRes, commentatorsRes] = await Promise.all([
          fetch(`/api/v1/matches/${matchId}`),
          fetch(`/api/v1/tournaments/${tournamentId}`),
          fetch(`/api/v1/tournaments/${tournamentId}/commentators`)
        ]);

        if (matchRes.ok) {
          const data = await matchRes.json();
          setCurrentMatch(data.match || null);
        } else {
          setCurrentMatch(null);
        }

        if (tournamentRes.ok) {
          const data = await tournamentRes.json();
          setCurrentTournament(data.tournament || null);
        } else {
          setCurrentTournament(null);
        }

        if (commentatorsRes.ok) {
          const data = await commentatorsRes.json();
          setCommentators(Array.isArray(data.commentators) ? data.commentators : []);
        } else {
          setCommentators([]);
        }
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [tournamentId, matchId, setCurrentMatch, setCurrentTournament]);

  const submitPrediction = async (): Promise<void> => {
    if (!currentMatch) return;
    if (!selectedCommentator) return;
    const commentator = commentators.find((c) => (c._id || c.id) === selectedCommentator);
    if (!commentator) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/v1/matches/${currentMatch._id}/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: commentator._id || commentator.id,
          username: commentator.name,
          prediction: scoreBlue > scoreRed ? "blue" : "red",
          blueScore: scoreBlue,
          redScore: scoreRed
        })
      });
      if (res.ok) {
        const refreshed = await fetch(`/api/v1/matches/${currentMatch._id}`);
        if (refreshed.ok) {
          const data = await refreshed.json();
          setCurrentMatch(data.match || null);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading predictions..." />
      </PageWrapper>
    );
  }

  if (!currentMatch || !currentTournament) {
    return (
      <PageWrapper {...pageProps}>
        <div className="text-center text-white">
          <div className="mb-4">Match not found</div>
          <Button onClick={() => router.push(`/modules/tournaments/${tournamentId}/matches`)}>Go Back</Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper {...pageProps}>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="text-white text-xl font-semibold">{currentMatch.name}</div>
          <Button
            onClick={() => router.push(`/modules/tournaments/${tournamentId}/matches/${matchId}`)}
            variant="secondary"
            size="sm"
          >
            Back to Match
          </Button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <div className="text-sm text-gray-300 mb-2">Select Commentator</div>
              <select
                value={selectedCommentator}
                onChange={(e) => setSelectedCommentator(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">Choose...</option>
                {commentators.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">Blue</span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={scoreBlue}
                  onChange={(e) => setScoreBlue(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-center"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">Red</span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={scoreRed}
                  onChange={(e) => setScoreRed(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-center"
                />
              </div>
            </div>
            <div>
              <Button onClick={submitPrediction} disabled={submitting || !selectedCommentator} className="w-full">
                {submitting ? "Submitting..." : "Submit Prediction"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-white font-medium">Existing Predictions</div>
            {currentMatch.predictions && currentMatch.predictions.length > 0 ? (
              <div className="space-y-2">
                {currentMatch.predictions.map((p: MatchPrediction, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-700 rounded p-3">
                    <div className="text-white">
                      {(p as unknown as { username?: string }).username ||
                        (p as unknown as { commentatorUsername?: string }).commentatorUsername ||
                        ""}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-gray-300 text-sm">
                        {(p as unknown as { blueScore?: number }).blueScore ?? 0} -{" "}
                        {(p as unknown as { redScore?: number }).redScore ?? 0}
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-semibold ${p.prediction === "blue" ? "bg-blue-600 text-blue-100" : "bg-red-600 text-red-100"}`}
                      >
                        {p.prediction.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No predictions yet</div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
