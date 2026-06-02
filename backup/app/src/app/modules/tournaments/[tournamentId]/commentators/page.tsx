"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTournaments } from "@libTournament/contexts/TournamentsContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { LoadingSpinner } from "@lib/components/common";
import { Tournament } from "@libTournament/types";
import { PageWrapper } from "@lib/layout";
import { Match, Commentator } from "@libTournament/types";
import { TbDeviceTvFilled } from "react-icons/tb";

export default function CommentatorsPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const { tournaments, loading: tournamentsLoading } = useTournaments();
  const { setActiveModule } = useNavigation();
  const [allCommentators, setAllCommentators] = useState<Commentator[]>([]);
  const [tournamentCommentators, setTournamentCommentators] = useState<Commentator[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const tournamentId = params.tournamentId as string;
  const pageProps = useMemo(() => {
    return {
      title: !tournament
        ? tournamentsLoading
          ? "Assign Commentators"
          : "Tournament Not Found"
        : "Assign Commentators",
      subtitle: `Manage commentators ${tournament?.abbreviation ? "for " + tournament?.abbreviation : ""}`,
      breadcrumbs: [
        { label: "Tournaments", href: "/modules/tournaments" },
        !tournament
          ? tournamentsLoading
            ? { label: "Loading...", href: `/modules/tournaments/${tournamentId}` }
            : { label: "Tournament Not Found", href: `/modules/tournaments/${tournamentId}` }
          : { label: tournament?.name || "Loading...", href: `/modules/tournaments/${tournamentId}` },
        { label: "Commentators", href: `/modules/tournaments/${tournamentId}/commentators`, isActive: true }
      ]
    };
  }, [tournament, tournamentId, tournamentsLoading]);

  useEffect(() => {
    setActiveModule("commentators");
  }, [setActiveModule]);

  useEffect(() => {
    if (!tournamentsLoading && tournamentId) {
      const foundTournament = tournaments.find((t) => t._id === tournamentId);
      if (foundTournament) {
        setTournament(foundTournament);
      } else {
        setTournament(null);
      }
    }
  }, [tournaments, tournamentsLoading, tournamentId, setTournament]);

  // Fetch all commentators, tournament commentators, and matches
  useEffect(() => {
    if (!tournamentId) return;

    setLoading(true);
    const fetchData = async () => {
      try {
        // Fetch all global commentators
        const commentatorsResponse = await fetch("/api/v1/commentators");
        if (commentatorsResponse.ok) {
          const commentatorsData = await commentatorsResponse.json();
          setAllCommentators(commentatorsData.commentators || []);
        } else if (commentatorsResponse.status === 302 || commentatorsResponse.redirected) {
          window.location.href = commentatorsResponse.url;
          return;
        }

        // Fetch tournament commentators
        const tournamentCommentatorsResponse = await fetch(`/api/v1/tournaments/${tournamentId}/commentators`);
        if (tournamentCommentatorsResponse.ok) {
          const tournamentCommentatorsData = await tournamentCommentatorsResponse.json();
          setTournamentCommentators(tournamentCommentatorsData.commentators || []);
        } else if (tournamentCommentatorsResponse.status === 302 || tournamentCommentatorsResponse.redirected) {
          window.location.href = tournamentCommentatorsResponse.url;
          return;
        }

        // Fetch tournament matches
        const matchesResponse = await fetch(`/api/v1/tournaments/${tournamentId}/matches`);
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setMatches(matchesData.matches || []);
        } else if (matchesResponse.status === 302 || matchesResponse.redirected) {
          window.location.href = matchesResponse.url;
          return;
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tournamentId]);

  const assignCommentatorToTournament = async (commentatorId: string) => {
    try {
      console.log("Assigning commentator to tournament:", { commentatorId, tournamentId });
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/commentators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentatorId })
      });

      if (response.ok) {
        // Refresh tournament commentators
        const tournamentCommentatorsResponse = await fetch(`/api/v1/tournaments/${tournamentId}/commentators`);
        if (tournamentCommentatorsResponse.ok) {
          const tournamentCommentatorsData = await tournamentCommentatorsResponse.json();
          setTournamentCommentators(tournamentCommentatorsData.commentators || []);
        }
        setSuccessMsg("Commentator assigned to tournament!");
      } else if (response.status === 302 || response.redirected) {
        // Handle redirect to login page
        window.location.href = response.url;
        return;
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          console.error("Error assigning commentator to tournament:", error);
          setSuccessMsg(`Error: ${error.error}`);
        } else {
          console.error("Error assigning commentator to tournament: Non-JSON response");
          setSuccessMsg("Authentication required. Redirecting to login...");
          window.location.href = "/login";
        }
      }
    } catch (error) {
      console.error("Error assigning commentator to tournament:", error);
      setSuccessMsg("Error assigning commentator to tournament");
    }
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const removeCommentatorFromTournament = async (commentatorId: string) => {
    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/commentators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentatorId })
      });

      if (response.ok) {
        // Refresh tournament commentators
        const tournamentCommentatorsResponse = await fetch(`/api/v1/tournaments/${tournamentId}/commentators`);
        if (tournamentCommentatorsResponse.ok) {
          const tournamentCommentatorsData = await tournamentCommentatorsResponse.json();
          setTournamentCommentators(tournamentCommentatorsData.commentators || []);
        }
        setSuccessMsg("Commentator removed from tournament!");
      } else if (response.status === 302 || response.redirected) {
        // Handle redirect to login page
        window.location.href = response.url;
        return;
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          setSuccessMsg(`Error: ${error.error}`);
        } else {
          setSuccessMsg("Authentication required. Redirecting to login...");
          window.location.href = "/login";
        }
      }
    } catch (error) {
      console.error("Error removing commentator from tournament:", error);
      setSuccessMsg("Error removing commentator from tournament");
    }
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const assignCommentatorToMatch = async (matchId: string, commentatorId: string) => {
    try {
      const response = await fetch(`/api/v1/matches/${matchId}/commentators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentatorId })
      });

      if (response.ok) {
        // Refresh matches
        const matchesResponse = await fetch(`/api/v1/tournaments/${tournamentId}/matches`);
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setMatches(matchesData.matches || []);
        }
        setSuccessMsg("Commentator assigned to match!");
      } else if (response.status === 302 || response.redirected) {
        // Handle redirect to login page
        window.location.href = response.url;
        return;
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          setSuccessMsg(`Error: ${error.error}`);
        } else {
          setSuccessMsg("Authentication required. Redirecting to login...");
          window.location.href = "/login";
        }
      }
    } catch (error) {
      console.error("Error assigning commentator:", error);
      setSuccessMsg("Error assigning commentator");
    }
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const removeCommentatorFromMatch = async (matchId: string, commentatorId: string) => {
    try {
      const response = await fetch(`/api/v1/matches/${matchId}/commentators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentatorId })
      });

      if (response.ok) {
        // Refresh matches
        const matchesResponse = await fetch(`/api/v1/tournaments/${tournamentId}/matches`);
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setMatches(matchesData.matches || []);
        }
        setSuccessMsg("Commentator removed from match!");
      } else if (response.status === 302 || response.redirected) {
        // Handle redirect to login page
        window.location.href = response.url;
        return;
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          setSuccessMsg(`Error: ${error.error}`);
        } else {
          setSuccessMsg("Authentication required. Redirecting to login...");
          window.location.href = "/login";
        }
      }
    } catch (error) {
      console.error("Error removing commentator:", error);
      setSuccessMsg("Error removing commentator");
    }
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  if (loading || tournamentsLoading) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading commentators..." />
      </PageWrapper>
    );
  }

  if (!tournament) {
    return (
      <PageWrapper {...pageProps}>
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Tournament not found</h2>
          <button
            onClick={() => router.push("/modules/tournaments")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Tournaments
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper {...pageProps} contentClassName="max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push(`/modules/tournaments/${tournamentId}`)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          ← Back to Tournament
        </button>
      </div>
      {successMsg && (
        <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-6">
          {successMsg}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Available Commentators</h3>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCommentators
              .filter(
                (commentator) =>
                  !tournamentCommentators.some((tc) => (tc._id || tc.id) === (commentator._id || commentator.id))
              )
              .map((commentator) => (
                <div
                  key={commentator._id || commentator.id || "unknown"}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                >
                  <div className="text-white font-medium">{commentator.name}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {commentator.xHandle && (
                      <span key="x" className="text-blue-400 text-sm">
                        𝕏 {commentator.xHandle}
                      </span>
                    )}
                    {commentator.instagramHandle && (
                      <span key="instagram" className="text-pink-400 text-sm">
                        📷 {commentator.instagramHandle}
                      </span>
                    )}
                    {commentator.twitchHandle && (
                      <span key="twitch" className="text-purple-400 text-sm">
                        <TbDeviceTvFilled className="w-4 h-4" /> {commentator.twitchHandle}
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        console.log("Button clicked for commentator:", commentator);
                        const id = commentator._id || commentator.id;
                        if (id) assignCommentatorToTournament(id);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Assign to Tournament
                    </button>
                  </div>
                </div>
              ))}
            {allCommentators.filter(
              (commentator) =>
                !tournamentCommentators.some((tc) => (tc._id || tc.id) === (commentator._id || commentator.id))
            ).length === 0 && (
              <div className="col-span-full text-gray-400 text-center py-8">
                All commentators are already assigned to this tournament.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Tournament Commentators ({tournamentCommentators.length})
        </h3>
        {tournamentCommentators.length === 0 ? (
          <div className="text-gray-400 bg-gray-800 rounded-lg p-6 text-center">
            No commentators assigned to this tournament yet. Assign commentators from the &quot;Available
            Commentators&quot; section above.
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournamentCommentators.map((commentator) => (
                <div
                  key={commentator._id || commentator.id || "unknown"}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                >
                  <div className="text-white font-medium">{commentator.name}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {commentator.xHandle && (
                      <span key="x" className="text-blue-400 text-sm">
                        𝕏 {commentator.xHandle}
                      </span>
                    )}
                    {commentator.instagramHandle && (
                      <span key="instagram" className="text-pink-400 text-sm">
                        📷 {commentator.instagramHandle}
                      </span>
                    )}
                    {commentator.twitchHandle && (
                      <span key="twitch" className="text-purple-400 text-sm">
                        📺 {commentator.twitchHandle}
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        const id = commentator._id || commentator.id;
                        if (id) removeCommentatorFromTournament(id);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Remove from Tournament
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Tournament Matches</h3>
        {matches.length === 0 ? (
          <div className="text-gray-400">No matches found for this tournament.</div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match._id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-white">{match.name}</h4>
                    <div className="text-gray-400 text-sm">
                      {match.blueTeamId} vs {match.redTeamId}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{match.commentators.length} commentator(s) assigned</div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Assigned Commentators</h5>
                    {match.commentators.length === 0 ? (
                      <div className="text-gray-500 text-sm">No commentators assigned</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {match.commentators.map((commentator) => (
                          <div
                            key={commentator._id}
                            className="bg-gray-700 rounded-lg px-3 py-2 flex items-center gap-2"
                          >
                            <span className="text-white text-sm">{commentator.name}</span>
                            <button
                              onClick={() => {
                                const id = commentator._id;
                                if (!id) return;
                                removeCommentatorFromMatch(match._id, id);
                              }}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Assign Tournament Commentator</h5>
                    <div className="flex flex-wrap gap-2">
                      {tournamentCommentators
                        .filter((c) => !match.commentators.some((mc) => (mc._id || mc.id) === (c._id || c.id)))
                        .map((commentator) => (
                          <button
                            key={commentator._id || commentator.id || "unknown"}
                            onClick={() => {
                              const id = commentator._id || commentator.id;
                              if (id) assignCommentatorToMatch(match._id, id);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          >
                            + {commentator.name}
                          </button>
                        ))}
                    </div>
                    {tournamentCommentators.length === 0 && (
                      <div className="text-gray-500 text-sm">
                        No tournament commentators available. Assign commentators to the tournament first.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
