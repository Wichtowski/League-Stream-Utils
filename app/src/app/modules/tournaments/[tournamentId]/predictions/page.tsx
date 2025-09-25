"use client";

import React, { useState, useEffect } from "react";
import { useTournaments } from "@libTournament/contexts/TournamentsContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { LoadingSpinner } from "@lib/components/common";
import { Tournament } from "@libTournament/types";
import { Match, MatchPrediction, Commentator } from "@libTournament/types";
import { PageWrapper } from "@lib/layout";
import { useParams } from "next/navigation";
import { useModal } from "@/lib/contexts/ModalContext";


export default function PredictionsPage(): React.ReactElement {
  const { tournaments, loading: tournamentsLoading } = useTournaments();
  const { setActiveModule } = useNavigation();
  const params = useParams();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingPrediction, setSubmittingPrediction] = useState<{ matchId: string; side: "blue" | "red" } | null>(null);
  const [scoreInputs, setScoreInputs] = useState<{ [matchId: string]: { blue: number; red: number } }>({});
  const [teams, setTeams] = useState<{ [teamId: string]: { name: string; tag: string } }>({});
  const [commentators, setCommentators] = useState<Array<Commentator>>([]);
  const { showAlert } = useModal();
  const tournamentId = params.tournamentId as string;
  const [selectedCommentator, setSelectedCommentator] = useState<string>("");

  useEffect(() => {
    setActiveModule("tournaments");
  }, [setActiveModule]);

  useEffect(() => {
    if (!tournamentsLoading && tournamentId) {
      const foundTournament = tournaments.find((t) => t._id === tournamentId);
      if (foundTournament) {
        setTournament(foundTournament);
      }
    }
  }, [tournaments, tournamentsLoading, tournamentId]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!tournamentId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/tournaments/${tournamentId}/matches`);
        if (response.ok) {
          const data = await response.json();
          setMatches(data.matches || []);
          
          // Fetch team data for all matches
          const teamIds = new Set<string>();
          data.matches?.forEach((match: Match) => {
            teamIds.add(match.blueTeamId);
            teamIds.add(match.redTeamId);
          });
          
          // Fetch team details
          const teamPromises = Array.from(teamIds).map(async (teamId) => {
            try {
              const teamResponse = await fetch(`/api/v1/teams/${teamId}`);
              if (teamResponse.ok) {
                const teamData = await teamResponse.json();
                return { teamId, team: teamData.team };
              }
            } catch (error) {
              console.error(`Failed to fetch team ${teamId}:`, error);
            }
            return null;
          });
          
          const teamResults = await Promise.all(teamPromises);
          const teamMap: { [teamId: string]: { name: string; tag: string } } = {};
          teamResults.forEach(result => {
            if (result) {
              teamMap[result.teamId] = {
                name: result.team.name,
                tag: result.team.tag
              };
            }
          });
          setTeams(teamMap);
        }
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [tournamentId]);

  // Fetch commentators for this tournament
  useEffect(() => {
    const fetchCommentators = async () => {
      if (!tournamentId) return;
      
      try {
        const response = await fetch(`/api/v1/tournaments/${tournamentId}/commentators`);
        if (response.ok) {
          const data = await response.json();
          setCommentators(data.commentators || []);
        } else {
          console.error("Failed to fetch commentators");
          setCommentators([]);
        }
      } catch (error) {
        console.error("Failed to fetch commentators:", error);
        setCommentators([]);
      }
    };

    fetchCommentators();
  }, [tournamentId]);

  if (loading || tournamentsLoading) {
    return (
      <PageWrapper>
        <LoadingSpinner fullscreen text="Loading predictions..." />
      </PageWrapper>
    );
  }

  if (!tournament) {
    return (
      <PageWrapper title="Tournament Not Found">
        <div className="text-center">
          <p>The tournament you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      </PageWrapper>
    );
  }

  const getTeamName = (teamId: string): string => {
    const team = teams[teamId];
    return team ? `${team.name} (${team.tag})` : "Unknown Team";
  };

  const getPredictionColor = (prediction: "blue" | "red"): string => {
    return prediction === "blue" ? "bg-blue-600 text-blue-100" : "bg-red-600 text-red-100";
  };

  const submitPrediction = async (matchId: string, blueScore: number, redScore: number) => {
    if (!selectedCommentator) {
      showAlert({ type: "error", title: "Please select a commentator first", message: "Please select a commentator first" });
      setSubmittingPrediction(null);
      return;
    }

    const commentator = commentators.find(c => c.id === selectedCommentator);
    if (!commentator) {
      showAlert({ type: "error", title: "Selected commentator not found", message: "Selected commentator not found" });
      setSubmittingPrediction(null);
      return;
    }

    try {
      setSubmittingPrediction({ matchId, side: blueScore > redScore ? "blue" : "red" });
      const res = await fetch(`/api/v1/matches/${matchId}/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: commentator.id,
          username: commentator.name,
          prediction: blueScore > redScore ? "blue" : "red",
          blueScore,
          redScore
        })
      });
      if (res.ok) {
        // Refresh matches to show updated predictions
        const response = await fetch(`/api/v1/tournaments/${tournamentId}/matches`);
        if (response.ok) {
          const data = await response.json();
          setMatches(data.matches || []);
        }
      } else {
        const error = await res.json();
        console.error("Prediction submission failed:", error);
      }
    } finally {
      setSubmittingPrediction(null);
    }
  };

  return (
    <PageWrapper
      title="Commentator Predictions"
      subtitle={`${tournament.name} (${tournament.abbreviation})`}
      breadcrumbs={[
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: tournament.name, href: `/modules/tournaments/${tournamentId}` },
        { label: "Predictions", href: `/modules/tournaments/${tournamentId}/predictions`, isActive: true }
      ]}
    >
      <div className="space-y-6">
        {matches.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">No Matches Available</h3>
            <p className="text-gray-400">No matches have been created for this tournament yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match) => (
              <div key={match._id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{match.name}</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">{match.format}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      match.status === "completed" ? "bg-green-600 text-green-100" :
                      match.status === "in-progress" ? "bg-yellow-600 text-yellow-100" :
                      "bg-gray-600 text-gray-200"
                    }`}>
                      {match.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Teams */}
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-white mb-3">Teams</h4>
                    <div className="flex items-center justify-between">
                      <div className="text-white">{getTeamName(match.blueTeamId)}</div>
                      <div className="text-gray-400">VS</div>
                      <div className="text-white">{getTeamName(match.redTeamId)}</div>
                    </div>
                  </div>

                  {/* Predictions */}
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-white mb-3">Commentator Predictions</h4>
                    
                    {/* Commentator Selection */}
                    <div className="space-y-3 mb-3">
                      <h5 className="text-sm font-medium text-gray-300">Select Commentator</h5>
                      <select
                        value={selectedCommentator}
                        onChange={(e) => setSelectedCommentator(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      >
                        <option value="">Choose a commentator...</option>
                        {commentators.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.xHandle && `(${c.xHandle})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Score Prediction Input */}
                    <div className="space-y-3 mb-3">
                      <h5 className="text-sm font-medium text-gray-300">Predict Score</h5>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-400">Blue:</label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            value={scoreInputs[match._id]?.blue || 0}
                            onChange={(e) => setScoreInputs(prev => ({
                              ...prev,
                              [match._id]: { 
                                ...prev[match._id], 
                                blue: parseInt(e.target.value) || 0 
                              }
                            }))}
                            className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center"
                          />
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-400">Red:</label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            value={scoreInputs[match._id]?.red || 0}
                            onChange={(e) => setScoreInputs(prev => ({
                              ...prev,
                              [match._id]: { 
                                ...prev[match._id], 
                                red: parseInt(e.target.value) || 0 
                              }
                            }))}
                            className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const scores = scoreInputs[match._id];
                            if (scores) {
                              submitPrediction(match._id, scores.blue, scores.red);
                            }
                          }}
                          disabled={submittingPrediction?.matchId === match._id || !scoreInputs[match._id] || !selectedCommentator}
                          className={`px-4 py-2 rounded text-sm font-medium ${
                            submittingPrediction?.matchId === match._id || !scoreInputs[match._id] || !selectedCommentator
                              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                        >
                          {submittingPrediction?.matchId === match._id 
                            ? "Submitting..." 
                            : "Submit Prediction"
                          }
                        </button>
                      </div>
                    </div>

                    {/* Existing Predictions */}
                    {match.predictions && match.predictions.length > 0 ? (
                      <div className="space-y-2">
                        {match.predictions.map((prediction: MatchPrediction, index: number) => (
                          <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-3">
                            <div className="text-white font-medium">{prediction.commentatorUsername}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-300">
                                {prediction.blueScore || 0} - {prediction.redScore || 0}
                              </span>
                              <div className={`px-3 py-1 rounded text-sm font-medium ${getPredictionColor(prediction.prediction)}`}>
                                {prediction.prediction.toUpperCase()}
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

                {/* Match Details */}
                {match.scheduledTime && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                      Scheduled: {new Date(match.scheduledTime).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
