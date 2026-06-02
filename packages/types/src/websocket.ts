import type { TeamSide } from './draft';

export type WSMessageType =
  | 'join'
  | 'ban'
  | 'pick'
  | 'hover'
  | 'gameState'
  | 'error'
  | 'teamUpdate'
  | 'ready'
  | 'timerUpdate'
  | 'configUpdate';

export interface WSMessage {
  type: WSMessageType;
  payload: Record<string, unknown>;
  sessionId?: string;
  teamSide?: TeamSide;
}
