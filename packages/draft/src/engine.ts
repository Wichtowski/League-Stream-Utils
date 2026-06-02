import { PICK_BAN_ORDER, TOTAL_DRAFT_TURNS } from '@lsu/types';
import type { GamePhase, TeamSide, ActionType, draftAction } from '@lsu/types';

export function getCurrentTurn(turnNumber: number) {
  if (turnNumber < 0 || turnNumber >= TOTAL_DRAFT_TURNS) return null;
  return PICK_BAN_ORDER[turnNumber];
}

export function getPhaseForTurn(turnNumber: number): GamePhase {
  if (turnNumber < 0) return 'config';
  if (turnNumber >= TOTAL_DRAFT_TURNS) return 'completed';
  return PICK_BAN_ORDER[turnNumber].phase;
}

export function getTeamForTurn(turnNumber: number): TeamSide {
  return PICK_BAN_ORDER[turnNumber]?.team ?? 'blue';
}

export function getActionTypeForTurn(turnNumber: number): ActionType {
  return PICK_BAN_ORDER[turnNumber]?.type ?? 'pick';
}

export function isChampionTaken(championId: number, actions: draftAction[]): boolean {
  return actions.some((a) => a.championId === championId && !a.undone);
}

export function isChampionBanned(championId: number, actions: draftAction[]): boolean {
  return actions.some((a) => a.championId === championId && a.type === 'ban' && !a.undone);
}

export function getTeamPicks(side: TeamSide, actions: draftAction[]): draftAction[] {
  return actions.filter((a) => a.teamSide === side && a.type === 'pick' && !a.undone);
}

export function getTeamBans(side: TeamSide, actions: draftAction[]): draftAction[] {
  return actions.filter((a) => a.teamSide === side && a.type === 'ban' && !a.undone);
}

export function getFearlessBannedChampions(
  previousGames: draftAction[][],
): Set<number> {
  const banned = new Set<number>();
  for (const game of previousGames) {
    for (const action of game) {
      if (action.type === 'pick' && !action.undone) {
        banned.add(action.championId);
      }
    }
  }
  return banned;
}

export function validateAction(
  turnNumber: number,
  championId: number,
  actions: draftAction[],
  fearlessBanned?: Set<number>,
): string | null {
  if (turnNumber >= TOTAL_DRAFT_TURNS) return 'Draft is complete';
  if (championId <= 0) return 'Invalid champion';
  if (isChampionTaken(championId, actions)) return 'Champion already selected';
  if (fearlessBanned?.has(championId)) return 'Champion banned in fearless draft';
  return null;
}
