"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@lib/contexts/AuthContext";
import { BackButton } from "@lib/components/common/buttons";
import { useTournaments } from "@lib/contexts/TournamentsContext";
import { PageWrapper } from "@lib/layout/PageWrapper";
import type { Tournament } from "@lib/types";
import type { BracketStructure, BracketNode } from "@lib/types/tournament";

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  startTime: string;
  tournament?: string;
}

const quickMatches: Match[] = [
  {
    id: "q1",
    teamA: "Team Alpha",
    teamB: "Team Beta",
    startTime: "2024-06-10T18:00:00Z",
    tournament: "Quick Match"
  },
  {
    id: "q2",
    teamA: "Team Gamma",
    teamB: "Team Delta",
    startTime: "2024-06-10T20:00:00Z",
    tournament: "Quick Match"
  }
];

interface ComentatorPredictionsPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default function ComentatorPredictionsPage({ params }: ComentatorPredictionsPageProps): React.ReactElement {
  const user = useUser();
  const { tournaments, getBracket } = useTournaments();
  const [mode, setMode] = useState<"tournament" | "quick">();
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTournamentId(resolvedParams.tournamentId);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (mode === "tournament" && selectedTournament) {
      setLoadingMatches(true);
      getBracket(selectedTournament.id)
        .then((res) => {
          if (res.success && res.bracket) {
            const structure = res.bracket.structure as BracketStructure;
            const nodes = structure.nodes || [];
            const matchList: Match[] = nodes
              .filter((n: BracketNode) => n.team1 && n.team2)
              .map((n: BracketNode) => ({
                id: n.id,
                teamA: n.team1!,
                teamB: n.team2!,
                startTime: n.scheduledTime ? new Date(n.scheduledTime).toISOString() : "",
                tournament: selectedTournament.name
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
    } else if (mode === "quick") {
      setMatches(quickMatches);
    } else {
      setMatches([]);
    }
  }, [mode, selectedTournament, getBracket]);

  if (!user) {
    return <PageWrapper requireAuth={true}>{null}</PageWrapper>;
  }

  if (!mode) {
    return (
      <PageWrapper
        title="Comentator Predictions"
        breadcrumbs={[
          { label: "Tournaments", href: "/modules/tournaments" },
          { label: selectedTournament?.name || "Loading...", href: `/modules/tournaments/${tournamentId}` },
          { label: "Commentator Predictions", href: `/modules/tournaments/${tournamentId}/commentators/predictions`, isActive: true }
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
        actions={<BackButton to="/modules">Back to Modules</BackButton>}
        contentClassName="max-w-xl mx-auto"
      >
        <ul className="space-y-4">
          {tournaments
            .filter((t) => t.status === "ongoing")
            .map((t) => (
              <li key={t.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
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
        actions={<BackButton to="/modules">Back to Modules</BackButton>}
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
              <li key={match.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="text-white font-semibold">
                    {match.teamA} vs {match.teamB}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {match.startTime ? new Date(match.startTime).toLocaleString() : ""}
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

  // Redirect to the match predictions page
  if (selectedMatch) {
    if (typeof window !== "undefined") {
      window.location.href = `/modules/comentators/predictions/${selectedMatch.id}`;
    }
    return <PageWrapper requireAuth={true}>{null}</PageWrapper>;
  }

  // This should never be reached, but TypeScript requires it
  return <PageWrapper requireAuth={true}>{null}</PageWrapper>;
}
