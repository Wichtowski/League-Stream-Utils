"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { getChampionById, getChampions } from "@lib/champions";
import { getChampionSquareImage } from "@libLeagueClient/components";
import type { GameSession, Champion } from "@lib/types";
import { API_BASE_URL } from "@lib/services/common/constants";
import { useChampionHoverAnimation, useTurnSequence } from "@lib/hooks/useChampSelectData";
import { PageWrapper } from "@lib/layout";
import { getTeamLogoUrl, getTournamentLogoUrl } from "@lib/services/common/image";
import { TeamPasswordModal } from "@libPickban/components/TeamPasswordModal";

interface PickBanAction {
  id: string;
  type: "pick" | "ban";
  championId: number;
  team: "blue" | "red";
  position: number;
  timestamp: Date;
}

export default function TeamPickBanPage() {
  const params = useParams();
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const { authenticatedFetch } = useAuthenticatedFetch();

  const sessionId = params.sessionId as string;
  const teamSide = params.teamSide as "blue" | "red";

  const [session, setSession] = useState<GameSession | null>(null);
  const [actions, setActions] = useState<PickBanAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showChampionSelect, setShowChampionSelect] = useState(false);
  const [pendingAction, setPendingAction] = useState<"pick" | "ban" | null>(null);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [blueTeamLogoUrl, setBlueTeamLogoUrl] = useState<string>("");
  const [redTeamLogoUrl, setRedTeamLogoUrl] = useState<string>("");
  const [tournamentLogoUrl, setTournamentLogoUrl] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getTeamBans = useCallback(
    (team: "blue" | "red") => {
      return actions.filter((action) => action.type === "ban" && action.team === team);
    },
    [actions]
  );

  const getTeamPicks = useCallback(
    (team: "blue" | "red") => {
      return actions.filter((action) => action.type === "pick" && action.team === team);
    },
    [actions]
  );

  // Create mock EnhancedChampSelectSession for hover animations
  const mockChampSelectData = useMemo(
    () => ({
      phase: session?.phase || "ban1",
      timer: {
        adjustedTimeLeftInPhase: timer,
        totalTimeInPhase: 30,
        phase: session?.phase || "ban1",
        isInfinite: false
      },
      chatDetails: { chatRoomName: "", chatRoomPassword: "" },
      myTeam: [],
      theirTeam: [],
      trades: [],
      actions: [],
      bans: {
        myTeamBans: getTeamBans(teamSide).map((ban) => ban.championId),
        theirTeamBans: getTeamBans(teamSide === "blue" ? "red" : "blue").map((ban) => ban.championId)
      },
      localPlayerCellId: 0,
      isSpectating: false
    }),
    [session?.phase, timer, getTeamBans, teamSide]
  );

  // Hover animation hooks
  const turnInfo = useTurnSequence(mockChampSelectData);
  const hoverAnimation = useChampionHoverAnimation(mockChampSelectData, turnInfo);

  useEffect(() => {
    const loadChampions = async () => {
      const championData = await getChampions();
      setChampions(championData);
    };
    loadChampions();
  }, []);

  // Load team logos when session changes
  useEffect(() => {
    if (session?.config) {
      const loadLogos = async () => {
        if (session.config.blueTeamId) {
          try {
            const response = await authenticatedFetch(`/api/v1/teams/${session.config.blueTeamId}`);
            if (response.ok) {
              const teamData = await response.json();
              const logoUrl = await getTeamLogoUrl(teamData.team);
              setBlueTeamLogoUrl(logoUrl);
            }
          } catch (error) {
            console.error("Failed to load blue team logo:", error);
          }
        }

        if (session.config.redTeamId) {
          try {
            const response = await authenticatedFetch(`/api/v1/teams/${session.config.redTeamId}`);
            if (response.ok) {
              const teamData = await response.json();
              const logoUrl = await getTeamLogoUrl(teamData.team);
              setRedTeamLogoUrl(logoUrl);
            }
          } catch (error) {
            console.error("Failed to load red team logo:", error);
          }
        }

        if (session.config.tournamentId) {
          try {
            const logoUrl = await getTournamentLogoUrl(session.config.tournamentId);
            setTournamentLogoUrl(logoUrl);
          } catch (error) {
            console.error("Failed to load tournament logo:", error);
          }
        }
      };

      loadLogos();
    }
  }, [session, authenticatedFetch]);

  // Polling for session updates
  useEffect(() => {
    if (!session) return;

    setIsConnected(true);

    const pollInterval = setInterval(async () => {
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions/${sessionId}`);
        if (response.ok) {
          const updatedSession = await response.json();
          setSession(updatedSession);

          // Update timer if session is in progress
          if (updatedSession.sessionState === "in_progress" && updatedSession.timer?.isActive) {
            const now = new Date();
            const startedAt = new Date(updatedSession.timer.startedAt);
            const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
            const remaining = Math.max(0, updatedSession.timer.totalTime - elapsed);
            setTimer(remaining);
          }
        }
      } catch (error) {
        console.error("Error polling session:", error);
        setIsConnected(false);
      }
    }, 1000); // Poll every second

    return () => {
      clearInterval(pollInterval);
      setIsConnected(false);
    };
  }, [sessionId, session, authenticatedFetch]);

  const filteredChampions = champions.filter(
    (champion: Champion) =>
      champion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      champion.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions/${sessionId}`);

      if (response.ok) {
        const data = await response.json();
        setSession(data);
        if (data.actions) {
          setActions(data.actions);
        }
        setIsMyTurn(data.currentTeam === teamSide);
      } else {
        await showAlert({ type: "error", message: "Failed to load session" });
        router.push("/modules/pickban/static");
      }
    } catch (_error) {
      await showAlert({ type: "error", message: "Failed to load session" });
      router.push("/modules/pickban/static");
    } finally {
      setLoading(false);
    }
  }, [sessionId, authenticatedFetch, showAlert, router, teamSide]);

  useEffect(() => {
    setActiveModule("pickban/static");
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, fetchSession, setActiveModule]);

  const handleReady = async () => {
    if (!isConnected) return;

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions/${sessionId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "ready",
          teamSide
        })
      });

      if (response.ok) {
        setIsReady(true);
        showAlert({ type: "success", message: "Team is ready!" });
      }
    } catch (error) {
      console.error("Error setting team ready:", error);
      showAlert({ type: "error", message: "Failed to set team ready" });
    }
  };

  const handleChampionAction = async (championId: number, actionType: "pick" | "ban") => {
    if (!session || !isConnected || !isMyTurn) return;

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions/${sessionId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: actionType,
          teamSide,
          championId
        })
      });

      if (response.ok) {
        setShowChampionSelect(false);
        setPendingAction(null);
        showAlert({
          type: "success",
          message: `${actionType === "pick" ? "Picked" : "Banned"} ${getChampionById(championId)?.name}`
        });
      }
    } catch (error) {
      console.error("Error performing action:", error);
      showAlert({ type: "error", message: `Failed to ${actionType} champion` });
    }
  };

  const getBannedChampions = () => {
    return actions.filter((action) => action.type === "ban").map((action) => action.championId);
  };

  const getPickedChampions = () => {
    return actions.filter((action) => action.type === "pick").map((action) => action.championId);
  };

  const openChampionSelect = (actionType: "pick" | "ban") => {
    setPendingAction(actionType);
    setShowChampionSelect(true);
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <PageWrapper requireAuth={false}>
        <div className="flex items-center justify-center">
          <div className="text-white">Session not found</div>
        </div>
      </PageWrapper>
    );
  }

  if (showPasswordModal && !isAuthenticated) {
    return (
      <TeamPasswordModal
        sessionId={sessionId}
        teamSide={teamSide}
        onPasswordCorrect={() => {
          setIsAuthenticated(true);
          setShowPasswordModal(false);
        }}
        onCancel={() => router.push("/modules/pickban/static")}
      />
    );
  }

  const myTeam = session.teams[teamSide];
  const opponentTeam = session.teams[teamSide === "blue" ? "red" : "blue"];
  const myTeamLogoUrl = teamSide === "blue" ? blueTeamLogoUrl : redTeamLogoUrl;
  const opponentTeamLogoUrl = teamSide === "blue" ? redTeamLogoUrl : blueTeamLogoUrl;

  return (
    <PageWrapper
      title={`${myTeam.name} - Pick & Ban`}
      subtitle={`Session: ${session.name || sessionId} (Real-time Team Interface)`}
      actions={
        <div className="flex gap-3">
          <div className="bg-green-900/30 border border-green-600 px-3 py-2 rounded-lg text-sm">
            Real-time Team Interface
          </div>
          <div
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              isConnected ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </div>
          <button
            onClick={() => router.push("/modules/pickban/static")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Sessions
          </button>
        </div>
      }
    >
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
            <span className="text-red-400">Connecting to session...</span>
          </div>
        </div>
      )}

      {/* Team Readiness */}
      {session.sessionState === "waiting" && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Team Readiness</h2>
              <p className="text-gray-400">Both teams must be ready to start the pick/ban phase</p>
            </div>
            {!isReady && (
              <button
                onClick={handleReady}
                disabled={!isConnected}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Ready to Start
              </button>
            )}
            {isReady && <div className="bg-green-600 text-white px-4 py-2 rounded-lg">Ready ✓</div>}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div
              className={`p-4 rounded-lg border ${session.teamReadiness?.blue ? "bg-green-900/30 border-green-600" : "bg-gray-700 border-gray-600"}`}
            >
              <div className="flex items-center">
                {blueTeamLogoUrl && (
                  <div className="w-8 h-8 rounded-lg overflow-hidden mr-3 bg-gray-700">
                    <Image
                      src={blueTeamLogoUrl}
                      alt="Blue Team Logo"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span className="font-medium">Blue Team</span>
                {session.teamReadiness?.blue && <span className="ml-auto text-green-400">✓</span>}
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border ${session.teamReadiness?.red ? "bg-green-900/30 border-green-600" : "bg-gray-700 border-gray-600"}`}
            >
              <div className="flex items-center">
                {redTeamLogoUrl && (
                  <div className="w-8 h-8 rounded-lg overflow-hidden mr-3 bg-gray-700">
                    <Image
                      src={redTeamLogoUrl}
                      alt="Red Team Logo"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span className="font-medium">Red Team</span>
                {session.teamReadiness?.red && <span className="ml-auto text-green-400">✓</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Phase Info */}
      {session.sessionState === "in_progress" && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {tournamentLogoUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden mr-4 bg-gray-700">
                  <Image
                    src={tournamentLogoUrl}
                    alt="Tournament Logo"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold capitalize">{session.phase?.replace(/(\d)/, " $1")} Phase</h2>
                <p className="text-gray-400">
                  {session.currentTeam === teamSide
                    ? "Your turn!"
                    : `${session.currentTeam === "blue" ? "Blue" : "Red"} team's turn`}
                </p>
              </div>
            </div>

            {/* Timer */}
            {timer > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{timer}s</div>
                <div className="text-sm text-gray-400">Time remaining</div>
              </div>
            )}

            {/* Action Buttons */}
            {isMyTurn && session.sessionState === "in_progress" && (
              <div className="flex gap-3">
                <button
                  onClick={() => openChampionSelect("ban")}
                  disabled={!session.phase?.startsWith("ban")}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Ban Champion
                </button>
                <button
                  onClick={() => openChampionSelect("pick")}
                  disabled={!session.phase?.startsWith("pick")}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Pick Champion
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Champion Selection Section */}
      {showChampionSelect && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Select Champion to {pendingAction === "pick" ? "Pick" : "Ban"}</h2>
            <button
              onClick={() => {
                setShowChampionSelect(false);
                setPendingAction(null);
              }}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search champions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-h-96 overflow-y-auto">
            {filteredChampions
              .filter(
                (champion) => !getBannedChampions().includes(champion.id) && !getPickedChampions().includes(champion.id)
              )
              .map((champion) => (
                <button
                  key={champion.id}
                  onClick={() => handleChampionAction(champion.id, pendingAction!)}
                  onMouseEnter={() => hoverAnimation.setHoveredChampionId(champion.id)}
                  onMouseLeave={() => hoverAnimation.setHoveredChampionId(null)}
                  className={`group relative aspect-square bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600 hover:border-blue-500 transition-colors ${
                    hoverAnimation.hoveredChampionId === champion.id ? hoverAnimation.animationClasses : ""
                  }`}
                >
                  <Image
                    src={getChampionSquareImage(champion.id) || champion.image}
                    alt={champion.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <div className="text-xs font-medium text-center truncate">{champion.name}</div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Teams Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* My Team */}
        <div
          className={`rounded-lg p-6 border ${teamSide === "blue" ? "bg-blue-900/30 border-blue-600" : "bg-red-900/30 border-red-600"}`}
        >
          <div className="flex items-center mb-4">
            {myTeamLogoUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden mr-3 bg-gray-700">
                <Image
                  src={myTeamLogoUrl}
                  alt={`${teamSide} Team Logo`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
            <h3 className={`text-xl font-semibold ${teamSide === "blue" ? "text-blue-400" : "text-red-400"}`}>
              {myTeam.name} (You)
            </h3>
          </div>

          {/* My Team Bans */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Bans</h4>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }, (_, i) => {
                const ban = getTeamBans(teamSide)[i];
                const champion = ban ? getChampionById(ban.championId) : null;

                return (
                  <div
                    key={i}
                    className="aspect-square bg-gray-800 rounded border border-gray-600 overflow-hidden relative"
                  >
                    {champion ? (
                      <>
                        <Image
                          src={getChampionSquareImage(champion.id) || champion.image}
                          alt={champion.name}
                          width={60}
                          height={60}
                          className="w-full h-full object-cover grayscale"
                        />
                        <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
                          <span className="text-white font-bold">X</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        Ban {i + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* My Team Picks */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Picks</h4>
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => {
                const pick = getTeamPicks(teamSide)[i];
                const champion = pick ? getChampionById(pick.championId) : null;

                return (
                  <div
                    key={i}
                    className={`flex items-center rounded p-3 ${teamSide === "blue" ? "bg-blue-800/30" : "bg-red-800/30"}`}
                  >
                    <div className="w-12 h-12 bg-gray-800 rounded border border-gray-600 overflow-hidden mr-3">
                      {champion ? (
                        <Image
                          src={getChampionSquareImage(champion.id) || champion.image}
                          alt={champion.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{champion?.name || `Player ${i + 1}`}</div>
                      <div className="text-xs text-gray-400">{champion?.title || "No champion selected"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Opponent Team */}
        <div
          className={`rounded-lg p-6 border ${teamSide === "blue" ? "bg-red-900/30 border-red-600" : "bg-blue-900/30 border-blue-600"}`}
        >
          <div className="flex items-center mb-4">
            {opponentTeamLogoUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden mr-3 bg-gray-700">
                <Image
                  src={opponentTeamLogoUrl}
                  alt={`${teamSide === "blue" ? "Red" : "Blue"} Team Logo`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
            <h3 className={`text-xl font-semibold ${teamSide === "blue" ? "text-red-400" : "text-blue-400"}`}>
              {opponentTeam.name}
            </h3>
          </div>

          {/* Opponent Team Bans */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Bans</h4>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }, (_, i) => {
                const ban = getTeamBans(teamSide === "blue" ? "red" : "blue")[i];
                const champion = ban ? getChampionById(ban.championId) : null;

                return (
                  <div
                    key={i}
                    className="aspect-square bg-gray-800 rounded border border-gray-600 overflow-hidden relative"
                  >
                    {champion ? (
                      <>
                        <Image
                          src={getChampionSquareImage(champion.id) || champion.image}
                          alt={champion.name}
                          width={60}
                          height={60}
                          className="w-full h-full object-cover grayscale"
                        />
                        <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
                          <span className="text-white font-bold">X</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        Ban {i + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Opponent Team Picks */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Picks</h4>
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => {
                const pick = getTeamPicks(teamSide === "blue" ? "red" : "blue")[i];
                const champion = pick ? getChampionById(pick.championId) : null;

                return (
                  <div
                    key={i}
                    className={`flex items-center rounded p-3 ${teamSide === "blue" ? "bg-red-800/30" : "bg-blue-800/30"}`}
                  >
                    <div className="w-12 h-12 bg-gray-800 rounded border border-gray-600 overflow-hidden mr-3">
                      {champion ? (
                        <Image
                          src={getChampionSquareImage(champion.id) || champion.image}
                          alt={champion.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{champion?.name || `Player ${i + 1}`}</div>
                      <div className="text-xs text-gray-400">{champion?.title || "No champion selected"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action History */}
      {actions.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Draft History</h3>
          <div className="space-y-2">
            {actions.map((action, index) => {
              const champion = getChampionById(action.championId);
              return (
                <div key={action.id} className="flex items-center justify-between bg-gray-700 rounded p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">#{index + 1}</span>
                    <div className="w-8 h-8 bg-gray-600 rounded overflow-hidden">
                      {champion && (
                        <Image
                          src={getChampionSquareImage(champion.id) || champion.image}
                          alt={champion.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">{champion?.name}</span>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs ${
                          action.type === "ban" ? "bg-red-600" : "bg-green-600"
                        }`}
                      >
                        {action.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    <span className={`px-2 py-1 rounded ${action.team === "blue" ? "bg-blue-600" : "bg-red-600"}`}>
                      {action.team.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
