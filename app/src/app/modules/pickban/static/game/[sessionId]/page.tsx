"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { getChampionById, getChampions } from "@lib/champions";
import type { GameSession, Champion } from "@lib/types";
import { API_BASE_URL } from "@lib/services/common/constants";
import Image from "next/image";
import { useChampionHoverAnimation, useTurnSequence } from "@lib/hooks/useChampSelectData";
import { PageWrapper } from "@lib/layout/PageWrapper";

interface PickBanAction {
  id: string;
  type: "pick" | "ban";
  championId: number;
  team: "blue" | "red";
  position: number;
  timestamp: Date;
}

export default function StaticPickBanGamePage() {
  const params = useParams();
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const { showAlert, showConfirm } = useModal();
  const { user: authUser } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();

  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<GameSession | null>(null);
  const [actions, setActions] = useState<PickBanAction[]>([]);
  const [currentPhase, setCurrentPhase] = useState<"ban1" | "pick1" | "ban2" | "pick2" | "finished">("ban1");
  const [currentTeam, setCurrentTeam] = useState<"blue" | "red">("blue");
  const [currentPosition, setCurrentPosition] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showChampionSelect, setShowChampionSelect] = useState(false);
  const [pendingAction, setPendingAction] = useState<"pick" | "ban" | null>(null);
  const [champions, setChampions] = useState<Champion[]>([]);

  const getTeamBans = (team: "blue" | "red") => {
    return actions.filter((action) => action.type === "ban" && action.team === team);
  };

  // Create mock EnhancedChampSelectSession for hover animations
  const mockChampSelectData = {
    phase: currentPhase,
    timer: {
      adjustedTimeLeftInPhase: 0,
      totalTimeInPhase: 0,
      phase: currentPhase,
      isInfinite: false
    },
    chatDetails: { chatRoomName: "", chatRoomPassword: "" },
    myTeam: [],
    theirTeam: [],
    trades: [],
    actions: [],
    bans: {
      myTeamBans: getTeamBans("blue").map((ban) => ban.championId),
      theirTeamBans: getTeamBans("red").map((ban) => ban.championId)
    },
    localPlayerCellId: 0,
    isSpectating: false
  };

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
  }, [sessionId, authenticatedFetch, showAlert, router]);

  useEffect(() => {
    setActiveModule("pickban/static");
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, fetchSession, setActiveModule]);

  const handleChampionAction = async (championId: number, actionType: "pick" | "ban") => {
    if (!session || !authUser) return;

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions/${sessionId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: actionType,
          championId,
          team: currentTeam,
          position: currentPosition
        })
      });

      if (response.ok) {
        const newAction: PickBanAction = {
          id: `${Date.now()}`,
          type: actionType,
          championId,
          team: currentTeam,
          position: currentPosition,
          timestamp: new Date()
        };

        setActions((prev) => [...prev, newAction]);
        advancePhase();
        setShowChampionSelect(false);
        setPendingAction(null);
      } else {
        const data = await response.json();
        await showAlert({
          type: "error",
          message: data.error || "Failed to perform action"
        });
      }
    } catch (_error) {
      await showAlert({ type: "error", message: "Failed to perform action" });
    }
  };

  const advancePhase = () => {
    // Simple phase progression logic for standard pick/ban format
    if (currentPhase === "ban1" && currentPosition === 3 && currentTeam === "red") {
      setCurrentPhase("pick1");
      setCurrentTeam("blue");
      setCurrentPosition(1);
    } else if (currentPhase === "pick1" && currentPosition === 3 && currentTeam === "red") {
      setCurrentPhase("ban2");
      setCurrentTeam("blue");
      setCurrentPosition(1);
    } else if (currentPhase === "ban2" && currentPosition === 2 && currentTeam === "red") {
      setCurrentPhase("pick2");
      setCurrentTeam("blue");
      setCurrentPosition(1);
    } else if (currentPhase === "pick2" && currentPosition === 2 && currentTeam === "red") {
      setCurrentPhase("finished");
    } else {
      // Advance position or switch team
      if (currentTeam === "blue") {
        setCurrentTeam("red");
      } else {
        setCurrentTeam("blue");
        if (currentPhase === "pick1" || currentPhase === "pick2") {
          setCurrentPosition((prev) => prev + 1);
        } else {
          setCurrentPosition((prev) => prev + 1);
        }
      }
    }
  };

  const undoLastAction = async () => {
    if (actions.length === 0) return;

    const confirmed = await showConfirm({
      type: "danger",
      title: "Undo Action",
      message: "Are you sure you want to undo the last action?",
      confirmText: "Undo",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions/${sessionId}/undo`, {
        method: "POST"
      });

      if (response.ok) {
        setActions((prev) => prev.slice(0, -1));
        // TODO: Implement proper phase reversal logic
      } else {
        const data = await response.json();
        await showAlert({
          type: "error",
          message: data.error || "Failed to undo action"
        });
      }
    } catch (_error) {
      await showAlert({ type: "error", message: "Failed to undo action" });
    }
  };

  const getBannedChampions = () => {
    return actions.filter((action) => action.type === "ban").map((action) => action.championId);
  };

  const getPickedChampions = () => {
    return actions.filter((action) => action.type === "pick").map((action) => action.championId);
  };

  const getTeamPicks = (team: "blue" | "red") => {
    return actions.filter((action) => action.type === "pick" && action.team === team);
  };

  const openChampionSelect = (actionType: "pick" | "ban") => {
    setPendingAction(actionType);
    setShowChampionSelect(true);
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
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

  return (
    <PageWrapper
      title={session.name || `Session ${sessionId}`}
      subtitle="Static Pick & Ban Interface"
      actions={
        <div className="flex gap-3">
          <button
            onClick={undoLastAction}
            disabled={actions.length === 0}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Undo Last
          </button>
          <button
            onClick={() => router.push("/modules/pickban/static")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Sessions
          </button>
        </div>
      }
    >
      {/* Champion Select Modal */}
      {showChampionSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Select Champion to {pendingAction === "pick" ? "Pick" : "Ban"}</h2>
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
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search champions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {filteredChampions
                  .filter(
                    (champion) =>
                      !getBannedChampions().includes(champion.id) && !getPickedChampions().includes(champion.id)
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
                        src={champion.image}
                        alt={champion.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <div className="text-xs font-medium text-center truncate">{champion.name}</div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Phase Info */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold capitalize">{currentPhase.replace(/(\d)/, " $1")} Phase</h2>
            <p className="text-gray-400">
              {currentPhase === "finished"
                ? "Draft Complete!"
                : `${currentTeam.charAt(0).toUpperCase() + currentTeam.slice(1)} team ${
                    currentPhase.startsWith("ban") ? "bans" : "picks"
                  } champion ${currentPosition}`}
            </p>
          </div>
          {currentPhase !== "finished" && (
            <div className="flex gap-3">
              <button
                onClick={() => openChampionSelect("ban")}
                disabled={!currentPhase.startsWith("ban")}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Ban Champion
              </button>
              <button
                onClick={() => openChampionSelect("pick")}
                disabled={!currentPhase.startsWith("pick")}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Pick Champion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Teams Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Blue Team */}
        <div className="bg-blue-900/30 rounded-lg p-6 border border-blue-600">
          <h3 className="text-xl font-semibold text-blue-400 mb-4">Blue Team</h3>

          {/* Blue Team Bans */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Bans</h4>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }, (_, i) => {
                const ban = getTeamBans("blue")[i];
                const champion = ban ? getChampionById(ban.championId) : null;

                return (
                  <div
                    key={i}
                    className="aspect-square bg-gray-800 rounded border border-gray-600 overflow-hidden relative"
                  >
                    {champion ? (
                      <>
                        <Image
                          src={champion.image}
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

          {/* Blue Team Picks */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Picks</h4>
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => {
                const pick = getTeamPicks("blue")[i];
                const champion = pick ? getChampionById(pick.championId) : null;

                return (
                  <div key={i} className="flex items-center bg-blue-800/30 rounded p-3">
                    <div className="w-12 h-12 bg-gray-800 rounded border border-gray-600 overflow-hidden mr-3">
                      {champion ? (
                        <Image
                          src={champion.image}
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

        {/* Red Team */}
        <div className="bg-red-900/30 rounded-lg p-6 border border-red-600">
          <h3 className="text-xl font-semibold text-red-400 mb-4">Red Team</h3>

          {/* Red Team Bans */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Bans</h4>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }, (_, i) => {
                const ban = getTeamBans("red")[i];
                const champion = ban ? getChampionById(ban.championId) : null;

                return (
                  <div
                    key={i}
                    className="aspect-square bg-gray-800 rounded border border-gray-600 overflow-hidden relative"
                  >
                    {champion ? (
                      <>
                        <Image
                          src={champion.image}
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

          {/* Red Team Picks */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Picks</h4>
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => {
                const pick = getTeamPicks("red")[i];
                const champion = pick ? getChampionById(pick.championId) : null;

                return (
                  <div key={i} className="flex items-center bg-red-800/30 rounded p-3">
                    <div className="w-12 h-12 bg-gray-800 rounded border border-gray-600 overflow-hidden mr-3">
                      {champion ? (
                        <Image
                          src={champion.image}
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
                          src={champion.image}
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
