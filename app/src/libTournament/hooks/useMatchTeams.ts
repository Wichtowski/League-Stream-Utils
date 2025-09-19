import { useState, useEffect } from "react";
import type { Team } from "@lib/types/team";
import type { Match } from "@lib/types/match";

export const useMatchTeams = (match: Match | null) => {
  const [blueTeam, setBlueTeam] = useState<Team | null>(null);
  const [redTeam, setRedTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (match?.blueTeamId) {
      fetch(`/api/v1/teams/${match.blueTeamId}`)
        .then(res => res.json())
        .then(data => setBlueTeam(data.team))
        .catch(() => setBlueTeam(null));
    }
  }, [match?.blueTeamId]);

  useEffect(() => {
    if (match?.redTeamId) {
      fetch(`/api/v1/teams/${match.redTeamId}`)
        .then(res => res.json())
        .then(data => setRedTeam(data.team))
        .catch(() => setRedTeam(null));
    }
  }, [match?.redTeamId]);

  const handleSwapTeams = (onUpdate: (updatedMatch: Match) => void): void => {
    if (!match) return;
    
    const updated = {
      ...match,
      blueTeamId: match.redTeamId,
      redTeamId: match.blueTeamId
    } as Match;

    onUpdate(updated);
  };

  return {
    blueTeam,
    setBlueTeam,
    redTeam,
    setRedTeam,
    handleSwapTeams
  };
};
