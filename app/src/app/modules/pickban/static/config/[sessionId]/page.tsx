"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import type { GameSession } from "@lib/types";
import { PageWrapper } from "@lib/layout/PageWrapper";

interface PickBanConfig {
  format: "tournament" | "ranked" | "custom";
  banPhases: number;
  pickPhases: number;
  timePerAction: number;
  autoAdvance: boolean;
  allowUndo: boolean;
  teamNames: {
    blue: string;
    red: string;
  };
}

export default function StaticConfigPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const { showAlert, showConfirm } = useModal();
  const { user: authUser } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();

  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<GameSession | null>(null);
  const [config, setConfig] = useState<PickBanConfig>({
    format: "tournament",
    banPhases: 2,
    pickPhases: 3,
    timePerAction: 30,
    autoAdvance: false,
    allowUndo: true,
    teamNames: {
      blue: "Blue Team",
      red: "Red Team",
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `/api/v1/pickban/sessions/${sessionId}`,
      );

      if (response.ok) {
        const data = await response.json();
        setSession(data);
        if (data.config) {
          setConfig((prev) => ({ ...prev, ...data.config }));
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
    fetchSession();
  }, [fetchSession, setActiveModule, authenticatedFetch, showAlert, router]);

  const saveConfig = async () => {
    if (!session || !authUser) return;

    setSaving(true);
    try {
      const response = await authenticatedFetch(
        `/api/v1/pickban/sessions/${sessionId}/config`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        },
      );

      if (response.ok) {
        await showAlert({
          type: "success",
          message: "Configuration saved successfully!",
          timeout: 3000,
        });
      } else {
        const data = await response.json();
        await showAlert({
          type: "error",
          message: data.error || "Failed to save configuration",
        });
      }
    } catch (_error) {
      await showAlert({
        type: "error",
        message: "Failed to save configuration",
      });
    } finally {
      setSaving(false);
    }
  };

  const startSession = async () => {
    if (!session || !authUser) return;

    const confirmed = await showConfirm({
      type: "default",
      title: "Start Pick & Ban",
      message:
        "Are you ready to start the pick & ban phase? You can still make changes after starting.",
      confirmText: "Start",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const response = await authenticatedFetch(
        `/api/v1/pickban/sessions/${sessionId}/start`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        router.push(`/modules/pickban/static/game/${sessionId}`);
      } else {
        const data = await response.json();
        await showAlert({
          type: "error",
          message: data.error || "Failed to start session",
        });
      }
    } catch (_error) {
      await showAlert({ type: "error", message: "Failed to start session" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-white">Loading configuration...</div>
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
      title="Configure Pick & Ban"
      subtitle={`Session ${sessionId}`}
      actions={
        <button
          onClick={() => router.push("/modules/pickban/static")}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Back to Sessions
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Form */}
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Draft Format</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="tournament"
                  checked={config.format === "tournament"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      format: e.target.value as PickBanConfig["format"],
                    }))
                  }
                  className="mr-2"
                />
                <div>
                  <span className="font-medium">Tournament</span>
                  <p className="text-sm text-gray-400">
                    Standard tournament format (3 bans, 5 picks each)
                  </p>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="ranked"
                  checked={config.format === "ranked"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      format: e.target.value as PickBanConfig["format"],
                    }))
                  }
                  className="mr-2"
                />
                <div>
                  <span className="font-medium">Ranked</span>
                  <p className="text-sm text-gray-400">
                    Ranked game format (5 bans, 5 picks each)
                  </p>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="custom"
                  checked={config.format === "custom"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      format: e.target.value as PickBanConfig["format"],
                    }))
                  }
                  className="mr-2"
                />
                <div>
                  <span className="font-medium">Custom</span>
                  <p className="text-sm text-gray-400">
                    Configure your own format
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Team Names */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Team Names</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Blue Team Name
                </label>
                <input
                  type="text"
                  value={config.teamNames.blue}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      teamNames: { ...prev.teamNames, blue: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500"
                  placeholder="Enter blue team name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Red Team Name
                </label>
                <input
                  type="text"
                  value={config.teamNames.red}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      teamNames: { ...prev.teamNames, red: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-red-500"
                  placeholder="Enter red team name"
                />
              </div>
            </div>
          </div>

          {/* Custom Format Settings */}
          {config.format === "custom" && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Custom Format Settings
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ban Phases
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={config.banPhases}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        banPhases: parseInt(e.target.value),
                      }))
                    }
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pick Phases
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={config.pickPhases}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        pickPhases: parseInt(e.target.value),
                      }))
                    }
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Timing Settings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Timing Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time per Action (seconds)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={config.timePerAction}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      timePerAction: parseInt(e.target.value),
                    }))
                  }
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Set to 0 for no timer
                </p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.autoAdvance}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      autoAdvance: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-sm">
                  Auto-advance to next phase when timer expires
                </span>
              </label>
            </div>
          </div>

          {/* Other Settings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Other Settings</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.allowUndo}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      allowUndo: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-sm">Allow undo actions</span>
              </label>
            </div>
          </div>
        </div>

        {/* Preview and Actions */}
        <div className="space-y-6">
          {/* Configuration Preview */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Configuration Preview
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Format:</span>
                <span className="capitalize">{config.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Blue Team:</span>
                <span>{config.teamNames.blue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Red Team:</span>
                <span>{config.teamNames.red}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time per Action:</span>
                <span>
                  {config.timePerAction > 0
                    ? `${config.timePerAction}s`
                    : "No timer"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Allow Undo:</span>
                <span>{config.allowUndo ? "Yes" : "No"}</span>
              </div>
              {config.format === "custom" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ban Phases:</span>
                    <span>{config.banPhases}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pick Phases:</span>
                    <span>{config.pickPhases}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Format Info */}
          <div className="bg-blue-900/30 rounded-lg p-6 border border-blue-600">
            <h3 className="font-semibold text-blue-400 mb-2">Draft Order</h3>
            <div className="text-sm text-gray-300 space-y-1">
              {config.format === "tournament" && (
                <>
                  <p>• Ban Phase 1: B1, R1, B2, R2, B3, R3</p>
                  <p>• Pick Phase 1: B1, R1, R2, B2</p>
                  <p>• Ban Phase 2: R3, B3</p>
                  <p>• Pick Phase 2: R3, B3, B4, R4, R5, B5</p>
                </>
              )}
              {config.format === "ranked" && (
                <>
                  <p>• Ban Phase 1: B1, R1, B2, R2, B3, R3, B4, R4, B5, R5</p>
                  <p>• Pick Phase: B1, R1, R2, B2, B3, R3, R4, B4, B5, R5</p>
                </>
              )}
              {config.format === "custom" && (
                <p>
                  Custom format with {config.banPhases} ban phases and{" "}
                  {config.pickPhases} pick phases
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-3 rounded-lg transition-colors"
            >
              {saving ? "Saving..." : "Save Configuration"}
            </button>
            <button
              onClick={startSession}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Start Pick & Ban
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
