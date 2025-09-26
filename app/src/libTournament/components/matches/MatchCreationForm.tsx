"use client";

import { useState, useEffect, useCallback } from "react";
import { Team } from "@libTeam/types";
import { useModal, useCurrentMatch, useUser } from "@lib/contexts";
import { Button, LoadingSpinner } from "@lib/components/common";
import { Match, CreateMatchRequest, BracketNode, Tournament } from "@libTournament/types";

interface MatchCreationFormProps {
  tournament: Tournament;
  bracketNodes?: BracketNode[];
  onMatchCreated?: (match: Match) => void;
}

interface FormData {
  name: string;
  blueTeamId: string;
  redTeamId: string;
  format: "BO1" | "BO3" | "BO5";
  isFearlessDraft: boolean;
  patchName: string;
  scheduledTime?: string;
  bracketNodeId?: string;
}

export const MatchCreationForm = ({
  tournament,
  bracketNodes,
  onMatchCreated
}: MatchCreationFormProps): React.ReactNode => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const { showAlert, showConfirm } = useModal();
  const { setCurrentMatch } = useCurrentMatch();
  const user = useUser();

  // Fetch teams directly
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setTeamsLoading(true);
        const response = await fetch("/api/v1/teams", {
          credentials: "include"
        });

        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams || []);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setTeamsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    blueTeamId: "",
    redTeamId: "",
    format: tournament.matchFormat,
    isFearlessDraft: tournament.fearlessDraft,
    patchName: "14.1", // Default patch
    scheduledTime: "",
    bracketNodeId: ""
  });

  const [creating, setCreating] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);

  // Filter teams based on tournament registration
  useEffect(() => {
    if (teams.length > 0) {
      const tournamentTeams = teams.filter(
        (team) => tournament.selectedTeams.includes(team._id) || tournament.registeredTeams.includes(team._id)
      );
      setAvailableTeams(tournamentTeams);
    }
  }, [teams, tournament.selectedTeams, tournament.registeredTeams]);

  // Filter available bracket nodes
  const availableBracketNodes =
    bracketNodes?.filter((node) => node.status === "pending" && node.team1 && node.team2) || [];

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateMatch = useCallback(async (): Promise<void> => {
    if (!formData.blueTeamId || !formData.redTeamId) {
      await showAlert({
        type: "error",
        message: "Please select both teams for the match"
      });
      return;
    }

    if (!formData.name.trim()) {
      await showAlert({
        type: "error",
        message: "Please enter a match name"
      });
      return;
    }

    setCreating(true);
    try {
      const matchData: CreateMatchRequest = {
        name: formData.name,
        type: "tournament",
        tournamentId: tournament._id,
        bracketNodeId: formData.bracketNodeId || undefined,
        blueTeamId: formData.blueTeamId,
        redTeamId: formData.redTeamId,
        format: formData.format,
        fearlessDraft: formData.isFearlessDraft,
        patchName: formData.patchName,
        scheduledTime: formData.scheduledTime || undefined,
        createdBy: user?._id || ""
      };

      const response = await fetch("/api/v1/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(matchData)
      });

      if (response.ok) {
        const data = await response.json();
        const newMatch = data.match;

        await showAlert({
          type: "success",
          message: "Match created successfully!"
        });

        // Ask if user wants to set this as current match
        const setAsCurrent = await showConfirm({
          message: "Match created! Would you like to set this as the current match?",
          confirmText: "Set as Current",
          cancelText: "Not Now"
        });

        if (setAsCurrent) {
          await setCurrentMatch(newMatch);
          await showAlert({
            type: "success",
            message: "Match set as current! You can now integrate with League Client."
          });
        }

        onMatchCreated?.(newMatch);

        // Reset form
        setFormData({
          name: "",
          blueTeamId: "",
          redTeamId: "",
          format: tournament.matchFormat,
          isFearlessDraft: tournament.fearlessDraft,
          patchName: "14.1",
          scheduledTime: "",
          bracketNodeId: ""
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create match");
      }
    } catch (error) {
      console.error("Error creating match:", error);
      await showAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create match"
      });
    } finally {
      setCreating(false);
    }
  }, [formData, tournament, onMatchCreated, showAlert, showConfirm, setCurrentMatch, user?._id]);

  const handleCreateFromBracket = useCallback(
    async (node: BracketNode): Promise<void> => {
      if (!node.team1 || !node.team2) {
        await showAlert({
          type: "error",
          message: "Bracket node must have both teams assigned"
        });
        return;
      }

      const blueTeam = availableTeams.find((t) => t._id === node.team1);
      const redTeam = availableTeams.find((t) => t._id === node.team2);

      if (!blueTeam || !redTeam) {
        await showAlert({
          type: "error",
          message: "One or both teams not found"
        });
        return;
      }

      const matchName = `Round ${node.round} - ${blueTeam.name} vs ${redTeam.name}`;

      setFormData((prev) => ({
        ...prev,
        name: matchName,
        blueTeamId: node.team1!,
        redTeamId: node.team2!,
        bracketNodeId: node._id
      }));
    },
    [availableTeams, showAlert]
  );

  if (teamsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Create New Match</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Match Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter match name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
            <select
              value={formData.format}
              onChange={(e) => handleInputChange("format", e.target.value as "BO1" | "BO3" | "BO5")}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BO1">Best of 1</option>
              <option value="BO3">Best of 3</option>
              <option value="BO5">Best of 5</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Blue Team</label>
            <select
              value={formData.blueTeamId}
              onChange={(e) => handleInputChange("blueTeamId", e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Blue Team</option>
              {availableTeams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Red Team</label>
            <select
              value={formData.redTeamId}
              onChange={(e) => handleInputChange("redTeamId", e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Red Team</option>
              {availableTeams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Patch</label>
            <input
              type="text"
              value={formData.patchName}
              onChange={(e) => handleInputChange("patchName", e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 14.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Scheduled Time</label>
            <input
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => handleInputChange("scheduledTime", e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isFearlessDraft}
              onChange={(e) => handleInputChange("isFearlessDraft", e.target.checked)}
              className="mr-2 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">Fearless Draft</span>
          </label>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleCreateMatch}
            disabled={creating || !formData.blueTeamId || !formData.redTeamId || !formData.name.trim()}
            className="w-full"
          >
            {creating ? "Creating..." : "Create Match"}
          </Button>
        </div>
      </div>

      {availableBracketNodes.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Create from Bracket</h3>
          <div className="space-y-3">
            {availableBracketNodes.map((node) => {
              const blueTeam = availableTeams.find((t) => t._id === node.team1);
              const redTeam = availableTeams.find((t) => t._id === node.team2);

              if (!blueTeam || !redTeam) return null;

              return (
                <div key={node._id} className="flex items-center justify-between p-3 bg-gray-800 rounded-md">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">Round {node.round}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-400 font-medium">{blueTeam.name}</span>
                      <span className="text-gray-400">vs</span>
                      <span className="text-red-400 font-medium">{redTeam.name}</span>
                    </div>
                  </div>
                  <Button onClick={() => handleCreateFromBracket(node)} size="sm" variant="secondary">
                    Create Match
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
