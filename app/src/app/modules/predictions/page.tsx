"use client";

import React, { useState } from "react";
import { useUser } from "@lib/contexts/AuthContext";
import { AuthGuard } from "@lib/components/AuthGuard";

// Placeholder type for a match
interface Match {
  id: string;
  teamA: string;
  teamB: string;
  startTime: string;
}

const upcomingMatches: Match[] = [
  { id: "1", teamA: "Team Alpha", teamB: "Team Beta", startTime: "2024-06-10T18:00:00Z" },
  { id: "2", teamA: "Team Gamma", teamB: "Team Delta", startTime: "2024-06-10T20:00:00Z" },
];

export default function PredictionsPage(): React.ReactElement {
  const user = useUser();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [prediction, setPrediction] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (!user) {
    return <AuthGuard />;
  }

  return (
    <AuthGuard loadingMessage="Loading predictions...">
      <div className="min-h-screen p-6 max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Comentator Predictions</h1>
        {!selectedMatch ? (
          <div>
            <h2 className="text-xl text-white mb-4">Select a match</h2>
            <ul className="space-y-4">
              {upcomingMatches.map((match) => (
                <li key={match.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="text-white font-semibold">{match.teamA} vs {match.teamB}</div>
                    <div className="text-gray-400 text-sm">{new Date(match.startTime).toLocaleString()}</div>
                  </div>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    onClick={() => setSelectedMatch(match)}
                  >
                    Select
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <h2 className="text-xl text-white mb-4">Prediction for {selectedMatch.teamA} vs {selectedMatch.teamB}</h2>
            {submitted ? (
              <div className="bg-green-700 text-white p-4 rounded-lg">Prediction submitted: <b>{prediction}</b></div>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-gray-300 mb-2">Who will win?</label>
                  <select
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    value={prediction}
                    onChange={e => setPrediction(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select team</option>
                    <option value={selectedMatch.teamA}>{selectedMatch.teamA}</option>
                    <option value={selectedMatch.teamB}>{selectedMatch.teamB}</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  disabled={!prediction}
                >
                  Submit Prediction
                </button>
                <button
                  type="button"
                  className="ml-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  onClick={() => { setSelectedMatch(null); setPrediction(""); setSubmitted(false); }}
                >
                  Back
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
} 