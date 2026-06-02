import type { GamePhase, TeamSide, ActionType } from './draft';

// ── Draft Turn Order ─────────────────────────────────────────
export interface DraftTurn {
  phase: GamePhase;
  team: TeamSide;
  type: ActionType;
}

/** Standard League of Legends pick/ban order — 22 turns total. */
export const PICK_BAN_ORDER: readonly DraftTurn[] = [
  // Ban phase 1 (6 bans)
  { phase: 'ban1', team: 'blue', type: 'ban' },
  { phase: 'ban1', team: 'red', type: 'ban' },
  { phase: 'ban1', team: 'blue', type: 'ban' },
  { phase: 'ban1', team: 'red', type: 'ban' },
  { phase: 'ban1', team: 'blue', type: 'ban' },
  { phase: 'ban1', team: 'red', type: 'ban' },
  // Pick phase 1 (6 picks)
  { phase: 'pick1', team: 'blue', type: 'pick' },
  { phase: 'pick1', team: 'red', type: 'pick' },
  { phase: 'pick1', team: 'red', type: 'pick' },
  { phase: 'pick1', team: 'blue', type: 'pick' },
  { phase: 'pick1', team: 'blue', type: 'pick' },
  { phase: 'pick1', team: 'red', type: 'pick' },
  // Ban phase 2 (4 bans)
  { phase: 'ban2', team: 'red', type: 'ban' },
  { phase: 'ban2', team: 'blue', type: 'ban' },
  { phase: 'ban2', team: 'red', type: 'ban' },
  { phase: 'ban2', team: 'blue', type: 'ban' },
  // Pick phase 2 (6 picks)
  { phase: 'pick2', team: 'red', type: 'pick' },
  { phase: 'pick2', team: 'blue', type: 'pick' },
  { phase: 'pick2', team: 'blue', type: 'pick' },
  { phase: 'pick2', team: 'red', type: 'pick' },
  { phase: 'pick2', team: 'red', type: 'pick' },
  { phase: 'pick2', team: 'blue', type: 'pick' },
] as const;

/** Default draft timer durations (seconds). */
export const DEFAULT_TIMERS = {
  pickPhase: 30,
  banPhase: 30,
} as const;

/** Canonical role display order. */
export const ROLE_ORDER: readonly string[] = [
  'TOP',
  'JUNGLE',
  'MID',
  'BOTTOM',
  'SUPPORT',
] as const;

/** Total turns in a standard draft. */
export const TOTAL_DRAFT_TURNS = PICK_BAN_ORDER.length;
