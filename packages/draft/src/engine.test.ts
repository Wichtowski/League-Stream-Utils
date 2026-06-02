import { describe, it, expect } from 'vitest';
import {
  getCurrentTurn,
  getPhaseForTurn,
  getTeamForTurn,
  getActionTypeForTurn,
  isChampionTaken,
  isChampionBanned,
  getTeamPicks,
  getTeamBans,
  getFearlessBannedChampions,
  validateAction,
} from './engine';
import type { draftAction } from '@lsu/types';

describe('draft engine', () => {
  describe('getCurrentTurn', () => {
    it('returns correct turn for index 0', () => {
      const turn = getCurrentTurn(0);
      expect(turn).toEqual({ phase: 'ban1', team: 'blue', type: 'ban' });
    });

    it('returns null for out-of-bounds', () => {
      expect(getCurrentTurn(-1)).toBeNull();
      expect(getCurrentTurn(22)).toBeNull();
      expect(getCurrentTurn(100)).toBeNull();
    });

    it('returns last turn at index 21', () => {
      const turn = getCurrentTurn(21);
      expect(turn).toEqual({ phase: 'pick2', team: 'blue', type: 'pick' });
    });
  });

  describe('getPhaseForTurn', () => {
    it('returns config for negative turn', () => {
      expect(getPhaseForTurn(-1)).toBe('config');
    });

    it('returns ban1 for turns 0-5', () => {
      for (let i = 0; i < 6; i++) {
        expect(getPhaseForTurn(i)).toBe('ban1');
      }
    });

    it('returns pick1 for turns 6-11', () => {
      for (let i = 6; i < 12; i++) {
        expect(getPhaseForTurn(i)).toBe('pick1');
      }
    });

    it('returns ban2 for turns 12-15', () => {
      for (let i = 12; i < 16; i++) {
        expect(getPhaseForTurn(i)).toBe('ban2');
      }
    });

    it('returns pick2 for turns 16-21', () => {
      for (let i = 16; i < 22; i++) {
        expect(getPhaseForTurn(i)).toBe('pick2');
      }
    });

    it('returns completed for turn >= 22', () => {
      expect(getPhaseForTurn(22)).toBe('completed');
      expect(getPhaseForTurn(50)).toBe('completed');
    });
  });

  describe('getTeamForTurn', () => {
    it('first ban is blue', () => {
      expect(getTeamForTurn(0)).toBe('blue');
    });

    it('second ban is red', () => {
      expect(getTeamForTurn(1)).toBe('red');
    });

    it('first pick is blue', () => {
      expect(getTeamForTurn(6)).toBe('blue');
    });

    it('picks 7-8 are red', () => {
      expect(getTeamForTurn(7)).toBe('red');
      expect(getTeamForTurn(8)).toBe('red');
    });
  });

  describe('getActionTypeForTurn', () => {
    it('returns ban for ban phases', () => {
      expect(getActionTypeForTurn(0)).toBe('ban');
      expect(getActionTypeForTurn(5)).toBe('ban');
      expect(getActionTypeForTurn(12)).toBe('ban');
    });

    it('returns pick for pick phases', () => {
      expect(getActionTypeForTurn(6)).toBe('pick');
      expect(getActionTypeForTurn(16)).toBe('pick');
    });
  });

  describe('champion state checks', () => {
    const actions: draftAction[] = [
      { championId: 1, type: 'ban', teamSide: 'blue', turnNumber: 0, undone: false },
      { championId: 2, type: 'pick', teamSide: 'blue', turnNumber: 6, undone: false },
      { championId: 3, type: 'pick', teamSide: 'red', turnNumber: 7, undone: false },
      { championId: 4, type: 'ban', teamSide: 'red', turnNumber: 1, undone: true },
    ];

    it('isChampionTaken detects taken champions', () => {
      expect(isChampionTaken(1, actions)).toBe(true);
      expect(isChampionTaken(2, actions)).toBe(true);
      expect(isChampionTaken(99, actions)).toBe(false);
    });

    it('isChampionTaken respects undone flag', () => {
      expect(isChampionTaken(4, actions)).toBe(false);
    });

    it('isChampionBanned detects bans', () => {
      expect(isChampionBanned(1, actions)).toBe(true);
      expect(isChampionBanned(2, actions)).toBe(false);
    });

    it('isChampionBanned respects undone flag', () => {
      expect(isChampionBanned(4, actions)).toBe(false);
    });

    it('getTeamPicks returns correct picks', () => {
      const picks = getTeamPicks('blue', actions);
      expect(picks).toHaveLength(1);
      expect(picks[0].championId).toBe(2);
    });

    it('getTeamBans returns correct bans', () => {
      const bans = getTeamBans('blue', actions);
      expect(bans).toHaveLength(1);
      expect(bans[0].championId).toBe(1);
    });
  });

  describe('getFearlessBannedChampions', () => {
    it('collects all picks from previous games', () => {
      const previousGames: draftAction[][] = [
        [
          { championId: 10, type: 'pick', teamSide: 'blue', turnNumber: 6, undone: false },
          { championId: 20, type: 'pick', teamSide: 'red', turnNumber: 7, undone: false },
          { championId: 30, type: 'ban', teamSide: 'blue', turnNumber: 0, undone: false },
        ],
      ];
      const banned = getFearlessBannedChampions(previousGames);
      expect(banned.has(10)).toBe(true);
      expect(banned.has(20)).toBe(true);
      expect(banned.has(30)).toBe(false);
    });

    it('respects undone picks', () => {
      const previousGames: draftAction[][] = [
        [{ championId: 10, type: 'pick', teamSide: 'blue', turnNumber: 6, undone: true }],
      ];
      const banned = getFearlessBannedChampions(previousGames);
      expect(banned.has(10)).toBe(false);
    });
  });

  describe('validateAction', () => {
    it('returns error when draft is complete', () => {
      expect(validateAction(22, 1, [])).toBe('Draft is complete');
    });

    it('returns error for invalid champion id', () => {
      expect(validateAction(0, 0, [])).toBe('Invalid champion');
      expect(validateAction(0, -1, [])).toBe('Invalid champion');
    });

    it('returns error for already taken champion', () => {
      const actions: draftAction[] = [
        { championId: 5, type: 'ban', teamSide: 'blue', turnNumber: 0, undone: false },
      ];
      expect(validateAction(1, 5, actions)).toBe('Champion already selected');
    });

    it('returns error for fearless banned champion', () => {
      const fearless = new Set([42]);
      expect(validateAction(0, 42, [], fearless)).toBe('Champion banned in fearless draft');
    });

    it('returns null for valid action', () => {
      expect(validateAction(0, 1, [])).toBeNull();
    });
  });
});
