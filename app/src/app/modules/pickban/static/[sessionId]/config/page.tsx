"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@lib/contexts/AuthContext";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import type { GameConfig, Team } from "@lib/types";
import type { Tournament } from "@lib/types/tournament";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { getTeamLogoUrl, getTournamentLogoUrl } from "@lib/services/common/image";

export default function ConfigPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();

  const [config, setConfig] = useState<GameConfig>({
    seriesType: "BO1",
    currentGame: 1,
    totalGames: 1,
    isFearlessDraft: false,
    patchName: "14.1",
    blueTeamName: "Blue Team",
    redTeamName: "Red Team",
    tournamentName: "",
    blueTeamId: "",
    redTeamId: "",
    tournamentId: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Tournament integration state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
  const [selectedBlueTeam, setSelectedBlueTeam] = useState<Team | null>(null);
  const [selectedRedTeam, setSelectedRedTeam] = useState<Team | null>(null);
  const [loadingTournaments, setLoadingTournaments] = useState(false);

  const [blueTeamLogoUrl, setBlueTeamLogoUrl] = useState<string>("");
  const [redTeamLogoUrl, setRedTeamLogoUrl] = useState<string>("");
  const [tournamentLogoUrl, setTournamentLogoUrl] = useState<string>("");

  useEffect(() => {
    if (selectedBlueTeam) {
      getTeamLogoUrl(selectedBlueTeam._id).then(setBlueTeamLogoUrl);
    } else {
      setBlueTeamLogoUrl("");
    }
  }, [selectedBlueTeam]);

  useEffect(() => {
    if (selectedRedTeam) {
      getTeamLogoUrl(selectedRedTeam._id).then(setRedTeamLogoUrl);
    } else {
      setRedTeamLogoUrl("");
    }
  }, [selectedRedTeam]);

  useEffect(() => {
    if (selectedTournament) {
      getTournamentLogoUrl(selectedTournament._id).then(setTournamentLogoUrl);
    } else {
      setTournamentLogoUrl("");
    }
  }, [selectedTournament]);

  const loadConfig = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`/api/v1/pickban/sessions/${sessionId}/config`);

      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  }, [sessionId, authenticatedFetch]);

  const loadTournaments = useCallback(async () => {
    try {
      setLoadingTournaments(true);
      const response = await authenticatedFetch("/api/v1/tournaments");

      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments || []);
      }
    } catch (error) {
      console.error("Failed to load tournaments:", error);
    } finally {
      setLoadingTournaments(false);
    }
  }, [authenticatedFetch]);

  const loadTournamentTeams = useCallback(
    async (tournamentId: string) => {
      try {
        const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}`);

        if (response.ok) {
          const data = await response.json();
          const tournament = data.tournament;

          // Get teams registered to this tournament
          const teamsResponse = await authenticatedFetch("/api/v1/teams");
          if (teamsResponse.ok) {
            const teamsData = await teamsResponse.json();
            const allTeams = teamsData.teams || [];

            // Filter teams that are registered to this tournament
            const registeredTeams = allTeams.filter((team: Team) => tournament.registeredTeams.includes(team._id));

            setTournamentTeams(registeredTeams);
          }
        }
      } catch (error) {
        console.error("Failed to load tournament teams:", error);
      }
    },
    [authenticatedFetch]
  );

  const handleTournamentSelect = useCallback(
    (tournament: Tournament) => {
      setSelectedTournament(tournament);
      setSelectedBlueTeam(null);
      setSelectedRedTeam(null);

      // Update config with tournament info - save ID instead of logo data
      setConfig((prev) => ({
        ...prev,
        tournamentId: tournament._id,
        tournamentName: tournament.name,
        seriesType: tournament.matchFormat,
        isFearlessDraft: tournament.fearlessDraft
      }));

      // Load teams for this tournament
      loadTournamentTeams(tournament._id);
    },
    [loadTournamentTeams]
  );

  const handleTeamSelect = useCallback((side: "blue" | "red", team: Team) => {
    if (side === "blue") {
      setSelectedBlueTeam(team);
      setConfig((prev) => ({
        ...prev,
        blueTeamId: team._id,
        blueTeamName: team.name,
        blueTeamPrefix: team.tag,
        blueCoach: team.staff?.coach ? { name: team.staff.coach.name } : undefined
      }));
    } else {
      setSelectedRedTeam(team);
      setConfig((prev) => ({
        ...prev,
        redTeamId: team._id,
        redTeamName: team.name,
        redTeamPrefix: team.tag,
        redCoach: team.staff?.coach ? { name: team.staff.coach.name } : undefined
      }));
    }
  }, []);

  const saveConfig = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/v1/pickban/sessions/${sessionId}/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ config })
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError("Failed to save configuration");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startMatch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/pickban/sessions/${sessionId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to start match");
      }

      // Redirect to the game page
      router.push(`/game/${sessionId}`);
    } catch (error) {
      setError("Failed to start match");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    loadTournaments();
  }, [loadConfig, loadTournaments]);

  return (
    <PageWrapper
      requireAuth={false}
      title="Match Configuration"
      className="bg-gradient-to-br from-blue-900 via-purple-900 to-red-900"
      contentClassName="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-block bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700">
          <span className="text-gray-300">Session ID:</span>
          <span className="ml-2 font-mono text-blue-400">{sessionId}</span>
        </div>
      </div>

      {error && <div className="bg-red-600/90 text-white p-4 rounded-lg mb-6 backdrop-blur-sm">{error}</div>}

      {success && (
        <div className="bg-green-600/90 text-white p-4 rounded-lg mb-6 backdrop-blur-sm">
          Configuration saved successfully!
        </div>
      )}

      <div className="grid gap-8">
        {/* Tournament Information */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-purple-300">Event/Tournament Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Tournament (Optional)</label>
              <select
                value={selectedTournament?._id || ""}
                onChange={(e) => {
                  const tournament = tournaments.find((t) => t._id === e.target.value);
                  if (tournament) {
                    handleTournamentSelect(tournament);
                  } else {
                    setSelectedTournament(null);
                    setTournamentTeams([]);
                    setSelectedBlueTeam(null);
                    setSelectedRedTeam(null);
                  }
                }}
                disabled={loadingTournaments}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500 disabled:opacity-50"
              >
                <option value="">Manual Configuration</option>
                {tournaments
                  .filter((tournament) => user?.isAdmin || tournament.userId === user?._id)
                  .map((tournament) => (
                    <option key={tournament._id} value={tournament._id}>
                      {tournament.name}
                    </option>
                  ))}
              </select>
              {loadingTournaments && <p className="text-xs text-gray-400 mt-1">Loading tournaments...</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Event Name</label>
              <input
                type="text"
                value={config.tournamentName || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    tournamentName: e.target.value
                  }))
                }
                disabled={!!selectedTournament}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., Spring Split Finals"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Event Logo URL (Optional)</label>
              <input
                type="url"
                value={tournamentLogoUrl || ""}
                onChange={() => {}}
                disabled={!!selectedTournament}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Tournament logo will be loaded automatically"
              />
            </div>
          </div>

          {selectedTournament && (
            <div className="mt-4 p-4 bg-purple-900/30 rounded-lg border border-purple-700/50">
              <p className="text-sm text-purple-300">
                <strong>Tournament Selected:</strong> {selectedTournament.name}
              </p>
              <p className="text-xs text-gray-400 mt-1">Configuration automatically loaded from tournament settings</p>
            </div>
          )}

          {config.tournamentId && (
            <div className="mt-4 text-center">
              <div className="inline-block bg-gray-700 rounded-lg p-4">
                <Image
                  src={tournamentLogoUrl}
                  alt="Event Logo Preview"
                  width={128}
                  height={64}
                  className="max-h-16 max-w-32 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Game Settings */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-blue-300">Game Settings</h2>

          <div
            className={`grid gap-6 ${config.seriesType === "BO1" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}
          >
            <div>
              <label className="block text-sm font-medium mb-2">Series Type</label>
              <select
                value={config.seriesType}
                onChange={(e) => {
                  const newSeriesType = e.target.value as "BO1" | "BO3" | "BO5";
                  setConfig((prev) => ({
                    ...prev,
                    seriesType: newSeriesType,
                    // Reset fearless draft if switching to BO1
                    isFearlessDraft: newSeriesType === "BO1" ? false : prev.isFearlessDraft
                  }));
                }}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500"
              >
                <option value="BO1">Best of 1</option>
                <option value="BO3">Best of 3</option>
                <option value="BO5">Best of 5</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Patch Version</label>
              <input
                type="text"
                value={config.patchName}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    patchName: e.target.value
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500"
                placeholder="e.g., 14.1"
              />
            </div>

            {config.seriesType !== "BO1" && (
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="fearlessDraft"
                  checked={config.isFearlessDraft}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      isFearlessDraft: e.target.checked
                    }))
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="fearlessDraft" className="text-sm font-medium">
                  Fearless Draft
                  <div className="text-xs text-gray-400 mt-1">Champions can only be picked once per series</div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Team Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Blue Team */}
          <div className="bg-blue-900/30 backdrop-blur-sm rounded-lg p-6 border border-blue-700/50">
            <h3 className="text-xl font-semibold mb-4 text-blue-300">Blue Team</h3>

            <div className="space-y-4">
              {selectedTournament && tournamentTeams.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Team</label>
                  <select
                    value={selectedBlueTeam?._id || ""}
                    onChange={(e) => {
                      const team = tournamentTeams.find((t) => t._id === e.target.value);
                      if (team) {
                        handleTeamSelect("blue", team);
                      } else {
                        setSelectedBlueTeam(null);
                        setConfig((prev) => ({
                          ...prev,
                          blueTeamId: "",
                          blueTeamName: "Blue Team",
                          blueTeamPrefix: "",
                          blueTeamLogo: "",
                          blueCoach: undefined
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500"
                  >
                    <option value="">Manual Entry</option>
                    {tournamentTeams
                      .filter((team) => team._id !== selectedRedTeam?._id)
                      .map((team) => (
                        <option key={team._id} value={team._id}>
                          {team.name} ({team.tag})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Team Name</label>
                <input
                  type="text"
                  value={config.blueTeamName || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      blueTeamName: e.target.value
                    }))
                  }
                  disabled={!!selectedBlueTeam && !!selectedBlueTeam.name}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Team Prefix (Optional)</label>
                <input
                  type="text"
                  value={config.blueTeamPrefix || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      blueTeamPrefix: e.target.value
                    }))
                  }
                  disabled={!!selectedBlueTeam && !!selectedBlueTeam.tag}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., BLU"
                  maxLength={5}
                />
              </div>

              {blueTeamLogoUrl && (
                <div>
                  <label className="block text-sm font-medium mb-2">Team Logo</label>
                  <div className="bg-blue-900/30 rounded-lg p-4 text-center">
                    <Image
                      src={blueTeamLogoUrl}
                      alt="Blue Team Logo Preview"
                      width={96}
                      height={48}
                      className="max-h-12 max-w-24 object-contain mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Coach Name (Optional)</label>
                <input
                  type="text"
                  value={config.blueCoach?.name || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      blueCoach: e.target.value ? { name: e.target.value } : undefined
                    }))
                  }
                  disabled={!!selectedBlueTeam && !!selectedBlueTeam.staff?.coach?.name}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter coach name"
                />
              </div>
            </div>
          </div>

          {/* Red Team */}
          <div className="bg-red-900/30 backdrop-blur-sm rounded-lg p-6 border border-red-700/50">
            <h3 className="text-xl font-semibold mb-4 text-red-300">Red Team</h3>

            <div className="space-y-4">
              {selectedTournament && tournamentTeams.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Team</label>
                  <select
                    value={selectedRedTeam?._id || ""}
                    onChange={(e) => {
                      const team = tournamentTeams.find((t) => t._id === e.target.value);
                      if (team) {
                        handleTeamSelect("red", team);
                      } else {
                        setSelectedRedTeam(null);
                        setConfig((prev) => ({
                          ...prev,
                          redTeamId: "",
                          redTeamName: "Red Team",
                          redTeamPrefix: "",
                          redCoach: undefined
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-red-500"
                  >
                    <option value="">Manual Entry</option>
                    {tournamentTeams
                      .filter((team) => team._id !== selectedBlueTeam?._id)
                      .map((team) => (
                        <option key={team._id} value={team._id}>
                          {team.name} ({team.tag})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Team Name</label>
                <input
                  type="text"
                  value={config.redTeamName || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      redTeamName: e.target.value
                    }))
                  }
                  disabled={!!selectedRedTeam && !!selectedRedTeam.name}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Team Prefix (Optional)</label>
                <input
                  type="text"
                  value={config.redTeamPrefix || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      redTeamPrefix: e.target.value
                    }))
                  }
                  disabled={!!selectedRedTeam && !!selectedRedTeam.tag}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., RED"
                  maxLength={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Coach Name (Optional)</label>
                <input
                  type="text"
                  value={config.redCoach?.name || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      redCoach: e.target.value ? { name: e.target.value } : undefined
                    }))
                  }
                  disabled={!!selectedRedTeam && !!selectedRedTeam.staff?.coach?.name}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter coach name"
                />
              </div>

              {redTeamLogoUrl && (
                <div className="col-span-full">
                  <div className="bg-red-900/30 rounded-lg p-4 text-center">
                    <Image
                      src={redTeamLogoUrl}
                      alt="Red Team Logo Preview"
                      width={96}
                      height={48}
                      className="max-h-12 max-w-24 object-contain mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={saveConfig}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 disabled:scale-100"
          >
            {loading ? "Saving..." : "Save Configuration"}
          </button>

          <button
            onClick={startMatch}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 disabled:scale-100"
          >
            {loading ? "Starting..." : "Start Match"}
          </button>
        </div>

        {/* Information Panel */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-yellow-400">Configuration Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Series:</span>
              <span className="ml-2 text-white">{config.seriesType}</span>
            </div>
            <div>
              <span className="text-gray-400">Patch:</span>
              <span className="ml-2 text-white">{config.patchName}</span>
            </div>
            <div>
              <span className="text-gray-400">Blue Team:</span>
              <span className="ml-2 text-blue-400">{config.blueTeamName || "Blue Team"}</span>
            </div>
            <div>
              <span className="text-gray-400">Red Team:</span>
              <span className="ml-2 text-red-400">{config.redTeamName || "Red Team"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">Fearless Draft:</span>
              <span className={`ml-2 ${config.isFearlessDraft ? "text-green-400" : "text-gray-400"}`}>
                {config.isFearlessDraft ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
