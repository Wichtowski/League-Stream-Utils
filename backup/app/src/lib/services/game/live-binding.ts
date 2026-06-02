import { LivePlayer } from "@libLeagueClient/types";
import type { Match } from "@libTournament/types/matches";
import type { Player } from "@lib/types/game";
import type { PlayerRole } from "@lib/types/common";

export type BoundPlayer = {
  rosterPlayer?: Player;
  livePlayer?: LivePlayer;
  team: "ORDER" | "CHAOS";
  resolvedRole: PlayerRole;
};

const ROLE_ORDER: PlayerRole[] = ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"];

const normalize = (value?: string): string => (value || "").trim().toLowerCase();

export const livePositionToRole = (position: string): PlayerRole | null => {
  const key = normalize(position);
  if (key === "top") return "TOP";
  if (key === "jungle") return "JUNGLE";
  if (key === "middle" || key === "mid") return "MID";
  if (key === "bottom" || key === "bot" || key === "adc") return "BOTTOM";
  if (key === "utility" || key === "support") return "SUPPORT";
  return null;
};

export const roleToLivePosition = (role: PlayerRole): string => {
  if (role === "TOP") return "TOP";
  if (role === "JUNGLE") return "JUNGLE";
  if (role === "MID") return "MIDDLE";
  if (role === "BOTTOM") return "BOTTOM";
  return "UTILITY";
};

const bindTeam = (roster: Player[], liveTeam: LivePlayer[], team: "ORDER" | "CHAOS"): BoundPlayer[] => {
  const used = new Set<number>();
  const boundPlayers: BoundPlayer[] = [];

  // 1) Try to match by exact name first
  roster.forEach((rosterPlayer) => {
    const idx = liveTeam.findIndex(
      (lp, i) => !used.has(i) && normalize(lp.summonerName) === normalize(rosterPlayer.inGameName)
    );
    if (idx >= 0) {
      const livePlayer = liveTeam[idx];
      const liveRole = livePositionToRole(livePlayer.position) || rosterPlayer.role;
      boundPlayers.push({
        rosterPlayer,
        livePlayer,
        team,
        resolvedRole: liveRole
      });
      used.add(idx);
    }
  });

  // 2) For remaining live players, create bound players without roster match
  liveTeam.forEach((lp, i) => {
    if (used.has(i)) return;
    const liveRole = livePositionToRole(lp.position);
    if (liveRole) {
      boundPlayers.push({
        rosterPlayer: undefined,
        livePlayer: lp,
        team,
        resolvedRole: liveRole
      });
      used.add(i);
    }
  });

  return boundPlayers;
};

export const bindLivePlayersToMatch = (
  livePlayers: LivePlayer[],
  match: Match & { blueTeam?: { players?: Player[] }; redTeam?: { players?: Player[] } }
): { blue: BoundPlayer[]; red: BoundPlayer[]; unbound: LivePlayer[] } => {
  const order = livePlayers.filter((p) => p.team === "ORDER");
  const chaos = livePlayers.filter((p) => p.team === "CHAOS");

  const blueRoster: Player[] = match.blueTeam?.players || [];
  const redRoster: Player[] = match.redTeam?.players || [];

  const blue = bindTeam(blueRoster, order, "ORDER");
  const red = bindTeam(redRoster, chaos, "CHAOS");

  const usedSet = new Set<string>();
  [...blue, ...red].forEach((b) => {
    if (b.livePlayer) usedSet.add(`${b.livePlayer.team}:${normalize(b.livePlayer.summonerName)}`);
  });

  const unbound = livePlayers.filter((lp) => !usedSet.has(`${lp.team}:${normalize(lp.summonerName)}`));

  return { blue, red, unbound };
};

export const getRoleOrder = (): PlayerRole[] => ROLE_ORDER;
