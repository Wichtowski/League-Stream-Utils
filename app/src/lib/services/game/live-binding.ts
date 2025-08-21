import type { LivePlayer } from "@lib/services/game/game-service";
import type { Match } from "@lib/types/match";
import type { Player } from "@lib/types/game";
import type { PlayerRole } from "@lib/types/common";

export type BoundPlayer = {
  rosterPlayer?: Player;
  livePlayer?: LivePlayer;
  team: "ORDER" | "CHAOS";
  resolvedRole: PlayerRole;
};

const ROLE_ORDER: PlayerRole[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

const normalize = (value?: string): string => (value || "").trim().toLowerCase();

const livePositionToRole = (position: string): PlayerRole | null => {
  const key = normalize(position);
  if (key === "top") return "TOP";
  if (key === "jungle") return "JUNGLE";
  if (key === "middle" || key === "mid") return "MID";
  if (key === "bottom" || key === "bot" || key === "adc") return "ADC";
  if (key === "utility" || key === "support") return "SUPPORT";
  return null;
};

const roleToLivePosition = (role: PlayerRole): string => {
  if (role === "TOP") return "TOP";
  if (role === "JUNGLE") return "JUNGLE";
  if (role === "MID") return "MIDDLE";
  if (role === "ADC") return "BOTTOM";
  return "UTILITY";
};

const bindTeam = (roster: Player[], liveTeam: LivePlayer[], team: "ORDER" | "CHAOS"): BoundPlayer[] => {
  const used = new Set<number>();

  const slots: BoundPlayer[] = ROLE_ORDER.map((role) => ({
    rosterPlayer: roster.find((p) => p.role === role),
    livePlayer: undefined,
    team,
    resolvedRole: role
  }));

  // 1) Try to match by exact name first. If name matches but live position differs,
  //    prioritize roster role (from the match) over live position.
  slots.forEach((slot) => {
    if (!slot.rosterPlayer) return;
    const idx = liveTeam.findIndex(
      (lp, i) => !used.has(i) && normalize(lp.summonerName) === normalize(slot.rosterPlayer!.inGameName)
    );
    if (idx >= 0) {
      slot.livePlayer = liveTeam[idx];
      used.add(idx);
      // Do not overwrite slot.resolvedRole here; keep the roster-defined role
      // so that the player is bound to the expected match position even if
      // the live feed reports a different lane/role.
    }
  });

  // 2) For remaining empty slots, match by live position/role
  slots.forEach((slot) => {
    if (slot.livePlayer) return;
    const idx = liveTeam.findIndex((lp, i) => !used.has(i) && livePositionToRole(lp.position) === slot.resolvedRole);
    if (idx >= 0) {
      slot.livePlayer = liveTeam[idx];
      used.add(idx);
    }
  });

  // 3) Any live players still unused – place them into the first empty slots (prioritize live data)
  liveTeam.forEach((lp, i) => {
    if (used.has(i)) return;
    const empty = slots.find((s) => !s.livePlayer);
    if (empty) {
      empty.livePlayer = lp;
      const liveRole = livePositionToRole(lp.position);
      if (liveRole) empty.resolvedRole = liveRole;
      used.add(i);
    }
  });

  return slots;
};

export const bindLivePlayersToMatch = (
  livePlayers: LivePlayer[],
  match: Match
): { blue: BoundPlayer[]; red: BoundPlayer[]; unbound: LivePlayer[] } => {
  const order = livePlayers.filter((p) => p.team === "ORDER");
  const chaos = livePlayers.filter((p) => p.team === "CHAOS");

  const blueRoster: Player[] = match.blueTeam.players || [];
  const redRoster: Player[] = match.redTeam.players || [];

  const blue = bindTeam(blueRoster, order, "ORDER");
  const red = bindTeam(redRoster, chaos, "CHAOS");

  const usedSet = new Set<string>();
  [...blue, ...red].forEach((b) => {
    if (b.livePlayer) usedSet.add(`${b.livePlayer.team}:${normalize(b.livePlayer.summonerName)}`);
  });

  const unbound = livePlayers.filter((lp) => !usedSet.has(`${lp.team}:${normalize(lp.summonerName)}`));

  return { blue, red, unbound };
};

export const createFallbackLivePlayer = (player: Player, team: "ORDER" | "CHAOS"): LivePlayer => ({
  summonerName: player.inGameName,
  championName: "Unknown",
  team,
  position: roleToLivePosition(player.role),
  scores: { kills: 0, deaths: 0, assists: 0, creepScore: 0, visionScore: 0 },
  items: [],
  level: 1,
  gold: 0,
  health: 0,
  maxHealth: 1,
  summonerSpells: {
    summonerSpellOne: { displayName: "", rawDescription: "" },
    summonerSpellTwo: { displayName: "", rawDescription: "" }
  },
  runes: {
    keystone: "",
    primaryRuneTree: "",
    secondaryRuneTree: ""
  }
});

export const getRoleOrder = (): PlayerRole[] => ROLE_ORDER;
