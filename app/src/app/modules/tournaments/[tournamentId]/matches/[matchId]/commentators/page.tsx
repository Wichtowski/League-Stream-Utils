"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageWrapper } from "@lib/layout";
import { LoadingSpinner, Button } from "@lib/components/common";
import type { Commentator } from "@libTournament/types";
import { useCurrentMatch } from "@libTournament/contexts/CurrentMatchContext";
import { useCurrentTournament } from "@libTournament/contexts/CurrentTournamentContext";

export default function MatchCommentatorsPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const matchId = params.matchId as string;

  const { currentMatch, setCurrentMatch } = useCurrentMatch();
  const { currentTournament, setCurrentTournament } = useCurrentTournament();
  const [loading, setLoading] = useState<boolean>(true);
  const [allCommentators, setAllCommentators] = useState<Commentator[]>([]);
  const [assigning, setAssigning] = useState<boolean>(false);

  const pageProps = useMemo(() => {
    return {
      title: currentMatch ? `Commentators • ${currentMatch.name}` : loading ? "Loading match..." : "Match not found",
      subtitle: currentTournament ? `${currentTournament.name} (${currentTournament.abbreviation})` : "",
      breadcrumbs: [
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: currentTournament?.name || "Tournament", href: `/modules/tournaments/${tournamentId}` },
        { label: "Matches", href: `/modules/tournaments/${tournamentId}/matches` },
        { label: currentMatch?.name || "Match", href: `/modules/tournaments/${tournamentId}/matches/${matchId}` },
        { label: "Commentators", href: `/modules/tournaments/${tournamentId}/matches/${matchId}/commentators`, isActive: true }
      ]
    };
  }, [currentMatch, currentTournament, tournamentId, matchId, loading]);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      if (!tournamentId || !matchId) return;
      setLoading(true);
      try {
        const [matchRes, tournamentRes, globalCommentatorsRes] = await Promise.all([
          fetch(`/api/v1/matches/${matchId}`),
          fetch(`/api/v1/tournaments/${tournamentId}`),
          fetch(`/api/v1/commentators`)
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

        if (globalCommentatorsRes.ok) {
          const data = await globalCommentatorsRes.json();
          setAllCommentators(Array.isArray(data.commentators) ? data.commentators : []);
        } else {
          setAllCommentators([]);
        }
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [tournamentId, matchId, setCurrentMatch, setCurrentTournament]);

  const assignToMatch = async (commentatorId: string): Promise<void> => {
    if (!currentMatch) return;
    try {
      setAssigning(true);
      const res = await fetch(`/api/v1/matches/${currentMatch._id}/commentators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentatorId })
      });
      if (res.ok) {
        const refreshed = await fetch(`/api/v1/matches/${currentMatch._id}`);
        if (refreshed.ok) {
          const data = await refreshed.json();
          setCurrentMatch(data.match || null);
        }
      }
    } finally {
      setAssigning(false);
    }
  };

  const removeFromMatch = async (commentatorId: string): Promise<void> => {
    if (!currentMatch) return;
    const res = await fetch(`/api/v1/matches/${currentMatch?._id}/commentators`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentatorId })
    });
    if (res.ok) {
      const refreshed = await fetch(`/api/v1/matches/${currentMatch?._id}`);
      if (refreshed.ok) {
        const data = await refreshed.json();
        setCurrentMatch(data.match || null);
      }
    }
  };

  if (loading) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading commentators..." />
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
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="text-white text-xl font-semibold">{currentMatch.name}</div>
          <Button onClick={() => router.push(`/modules/tournaments/${tournamentId}/matches/${matchId}`)} variant="secondary" size="sm">Back to Match</Button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-white font-medium mb-3">Assigned Commentators</div>
          {currentMatch.commentators && currentMatch.commentators.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentMatch.commentators.map((c) => (
                <div key={c._id} className="bg-gray-700 rounded px-3 py-2 flex items-center gap-2">
                  <span className="text-sm text-white">{c.name}</span>
                  <button onClick={() => c._id && removeFromMatch(c._id)} className="text-red-400 hover:text-red-300 text-sm">×</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No commentators assigned</div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-white font-medium mb-3">Assign From Global Commentators</div>
          {allCommentators.length === 0 ? (
            <div className="text-gray-400 text-sm">No global commentators available.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allCommentators
                .filter((gc) => !currentMatch.commentators.some((mc) => (mc._id || mc.id) === (gc._id || gc.id)))
                .map((gc) => (
                  <Button key={gc._id || gc.id} size="sm" disabled={assigning} onClick={() => (gc._id || gc.id) && assignToMatch(gc._id || (gc.id as string))}>
                    + {gc.name}
                  </Button>
                ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}


