// Shared pick/ban turn-to-index mappings for champion select
export const PICK_BAN_MAPPINGS = {
  blue: {
    6: 0, // Blue first pick
    9: 1, // Blue second pick
    10: 2, // Blue third pick
    17: 3, // Blue fourth pick
    18: 4 // Blue fifth pick
  },
  red: {
    7: 0, // Red first pick
    8: 1, // Red second pick
    11: 2, // Red third pick
    16: 3, // Red fourth pick
    19: 4 // Red fifth pick
  }
} as const;

export const getPlayerIndexFromTurn = (turn: number, team: "blue" | "red"): number | undefined => {
  return PICK_BAN_MAPPINGS[team][turn as keyof typeof PICK_BAN_MAPPINGS[typeof team]];
};
