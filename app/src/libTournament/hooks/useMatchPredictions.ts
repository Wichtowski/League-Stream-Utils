import { useState, useEffect } from "react";
import type { Match } from "@libTournament/types/matches";
import type { MatchPrediction } from "@libTournament/types";

export const useMatchPredictions = (match: Match | null) => {
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]);
  const [submittingPrediction, setSubmittingPrediction] = useState<"blue" | "red" | null>(null);

  useEffect(() => {
    const loadPredictions = async () => {
      if (!match) return;
      try {
        const res = await fetch(`/api/v1/matches/${match._id}/predictions`);
        if (res.ok) {
          const data = await res.json();
          setPredictions(
            (data.predictions || []).map((p: MatchPrediction) => ({
              username: p.commentatorUsername,
              prediction: p.prediction,
              submittedAt: p.submittedAt,
              confidence: p.confidence
            }))
          );
        }
      } catch (_e) {
        // noop
      }
    };
    loadPredictions();
  }, [match]);

  const submitPrediction = async (side: "blue" | "red"): Promise<boolean> => {
    if (!match) return false;
    try {
      setSubmittingPrediction(side);
      const res = await fetch(`/api/v1/matches/${match._id}/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prediction: side })
      });
      if (res.ok) {
        const data = await res.json();

        setPredictions(
          (data.predictions || []).map((p: MatchPrediction) => ({
            username: p.commentatorUsername,
            prediction: p.prediction,
            submittedAt: p.submittedAt,
            confidence: p.confidence
          }))
        );
        return true;
      }
      return false;
    } finally {
      setSubmittingPrediction(null);
    }
  };

  return {
    predictions,
    setPredictions,
    submittingPrediction,
    submitPrediction
  };
};
