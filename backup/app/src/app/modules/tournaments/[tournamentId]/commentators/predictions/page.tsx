"use client";

import React, { useState, useEffect } from "react";
import { useTournaments } from "@libTournament/contexts/TournamentsContext";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { Tournament, BracketStructure, BracketNode } from "@libTournament/types";
import { useParams } from "next/navigation";
import { Match } from "@libTournament/types";

export default function CommentatorPredictionsPage(): React.ReactElement {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const { tournaments, getBracket } = useTournaments();
  const [mode, setMode] = useState<"tournament" | "quick">();
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const selectedTournamentName: string = selectedTournament ? selectedTournament.name : "Loading...";

  useEffect(() => {
    setSelectedTournament(tournaments.find((t) => t._id === tournamentId) || null);
  }, [tournamentId, tournaments]);

  useEffect(() => {
    if (mode === "tournament" && selectedTournament) {
      setLoadingMatches(true);
      getBracket(selectedTournament._id)
        .then((res) => {
          if (res.success && res.bracket) {
            const structure = res.bracket as BracketStructure;
            const nodes = structure.nodes || [];
            const matchList: Match[] = nodes
              .filter((n: BracketNode) => n.team1 && n.team2)
              .map((n: BracketNode) => ({
                _id: n._id,
                name: `${n.team1} vs ${n.team2}`,
                blueTeamId: n.team1!,
                redTeamId: n.team2!,
                format: selectedTournament.matchFormat,
                patchName: selectedTournament.patchVersion || "",
                isFearlessDraft: false,
                scheduledTime: n.scheduledTime ? new Date(n.scheduledTime) : undefined,
                startTime: n.scheduledTime ? new Date(n.scheduledTime) : undefined,
                endTime: n.scheduledTime ? new Date(n.scheduledTime) : undefined,
                status: "scheduled",
                winner: undefined,
                score: undefined,
                games: [],
                commentators: [],
                predictions: [],
                createdBy: selectedTournament.userId,
                createdAt: selectedTournament.createdAt,
                updatedAt: selectedTournament.updatedAt,
                type: "tournament"
              }));
            setMatches(matchList);
          } else {
            setMatches([]);
          }
          setLoadingMatches(false);
        })
        .catch(() => {
          setMatches([]);
          setLoadingMatches(false);
        });
    } else {
      setMatches([]);
    }
  }, [mode, selectedTournament, getBracket]);

  // Public page: no auth gate

  if (!mode) {
    return (
      <PageWrapper
        title="Commentator Predictions"
        requireAuth={false}
        breadcrumbs={[
          { label: "Tournaments", href: "/modules/tournaments" },
          { label: selectedTournamentName, href: `/modules/tournaments/${tournamentId}` },
          {
            label: "Commentator Predictions",
            href: `/modules/tournaments/${tournamentId}/commentators/predictions`,
            isActive: true
          }
        ]}
        contentClassName="max-w-xl mx-auto"
      >
        <div className="space-y-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full"
            onClick={() => setMode("tournament")}
          >
            Select Tournament
          </button>
          <button
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg w-full"
            onClick={() => setMode("quick")}
          >
            Quick Match
          </button>
        </div>
      </PageWrapper>
    );
  }

  if (mode === "tournament" && !selectedTournament) {
    return (
      <PageWrapper
        title="Select Tournament"
        requireAuth={false}
        breadcrumbs={[
          { label: "Tournaments", href: "/modules/tournaments" },
          { label: selectedTournamentName, href: `/modules/tournaments/${tournamentId}` },
          { label: "Commentators", href: `/modules/tournaments/${tournamentId}/commentators` },
          {
            label: "Predictions",
            href: `/modules/tournaments/${tournamentId}/commentators/predictions`,
            isActive: true
          }
        ]}
        contentClassName="max-w-xl mx-auto"
      >
        <ul className="space-y-4">
          {tournaments
            .filter((t) => t.status === "ongoing")
            .map((t) => (
              <li key={t._id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                <div className="text-white font-semibold">{t.name}</div>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  onClick={() => setSelectedTournament(t)}
                >
                  Select
                </button>
              </li>
            ))}
        </ul>
        {tournaments.filter((t) => t.status === "ongoing").length === 0 && (
          <div className="text-gray-400 mt-4">No ongoing tournaments available.</div>
        )}
        <button
          className="mt-6 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          onClick={() => setMode(undefined)}
        >
          Back
        </button>
      </PageWrapper>
    );
  }

  if (!selectedMatch) {
    return (
      <PageWrapper
        title="Select a match"
        requireAuth={false}
        breadcrumbs={[
          { label: "Tournaments", href: "/modules/tournaments" },
          { label: selectedTournamentName, href: `/modules/tournaments/${tournamentId}` },
          { label: "Commentator", href: `/modules/tournaments/${tournamentId}/commentators/` },
          {
            label: "Predictions",
            href: `/modules/tournaments/${tournamentId}/commentators/predictions`,
            isActive: true
          }
        ]}
        contentClassName="max-w-xl mx-auto"
      >
        <h2 className="text-xl text-white mb-4">Select a match</h2>
        {loadingMatches ? (
          <div className="text-white">Loading matches...</div>
        ) : matches.length === 0 && mode === "tournament" ? (
          <div className="text-gray-400">
            No matches available yet. The tournament bracket will be available once the tournament starts.
          </div>
        ) : (
          <ul className="space-y-4">
            {matches.map((match) => (
              <li key={match._id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="text-white font-semibold">
                    {match.blueTeamId} vs {match.redTeamId}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : ""}
                  </div>
                </div>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  onClick={() => setSelectedMatch(match)}
                >
                  Select
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          className="mt-6 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          onClick={() => {
            if (mode === "tournament") setSelectedTournament(null);
            else setMode(undefined);
          }}
        >
          Back
        </button>
      </PageWrapper>
    );
  }

  // Redirect to the match page predictions section
  if (selectedMatch) {
    if (typeof window !== "undefined") {
      window.location.href = `/modules/tournaments/${tournamentId}/matches/${selectedMatch._id}`;
    }
    return <PageWrapper requireAuth={false}>{null}</PageWrapper>;
  }

  // This should never be reached, but TypeScript requires it
  return <PageWrapper requireAuth={false}>{null}</PageWrapper>;
}
