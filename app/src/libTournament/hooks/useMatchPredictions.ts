import { useState, useEffect } from "react";
import type { Match } from "@lib/types/match";

interface Prediction {
  username: string;
  prediction: "blue" | "red";
  submittedAt?: string;
}

export const useMatchPredictions = (match: Match | null) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [submittingPrediction, setSubmittingPrediction] = useState<"blue" | "red" | null>(null);

  useEffect(() => {
    const loadPredictions = async () => {
      if (!match) return;
      try {
        const res = await fetch(`/api/v1/matches/${match._id}/predictions`);
        if (res.ok) {
          const data = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPredictions((data.predictions || []).map((p: any) => ({ 
            username: p.username || p.commentatorName, 
            prediction: p.prediction, 
            submittedAt: p.submittedAt || p.timestamp 
          })));
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
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPredictions((data.predictions || []).map((p: any) => ({ 
          username: p.username || p.commentatorName, 
          prediction: p.prediction, 
          submittedAt: p.submittedAt || p.timestamp 
        })));
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
