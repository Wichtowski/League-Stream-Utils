export const colors = {
  // Primary brand colors
  primary: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9", // Main blue
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
  },

  // Gaming-focused accent colors
  accent: {
    gold: "#ffd700",
    "gold-dark": "#b8860b",
    "game-green": "#00ff41",
    "error-red": "#ff4444",
    "warning-orange": "#ff8c00",
  },

  // Dark theme grays (main theme)
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937", // Main dark bg
    850: "#1a202c", // Darker variant
    900: "#111827", // Darkest
    950: "#0a0f1a", // Extra dark
  },

  // Team colors for tournaments
  team: {
    blue: {
      light: "#3b82f6",
      default: "#1d4ed8",
      dark: "#1e40af",
    },
    red: {
      light: "#ef4444",
      default: "#dc2626",
      dark: "#b91c1c",
    },
  },

  // Status colors
  status: {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },

  // Camera/streaming specific colors
  camera: {
    live: "#22c55e",
    offline: "#6b7280",
    error: "#ef4444",
    border: "#374151",
  },

  // Tournament bracket colors
  bracket: {
    winner: "#10b981",
    loser: "#6b7280",
    upcoming: "#3b82f6",
    live: "#f59e0b",
  },
} as const;

export type ColorScheme = typeof colors;

// Helper function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
  return `${color}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")}`;
};

// Common color combinations
export const colorCombinations = {
  darkCard: {
    bg: colors.gray[800],
    border: colors.gray[700],
    text: colors.gray[100],
    textMuted: colors.gray[400],
  },

  gameCard: {
    bg: colors.gray[850],
    border: colors.gray[600],
    text: colors.gray[50],
    accent: colors.primary[500],
  },

  button: {
    primary: {
      bg: colors.primary[600],
      hover: colors.primary[700],
      text: colors.gray[50],
    },
    secondary: {
      bg: colors.gray[600],
      hover: colors.gray[700],
      text: colors.gray[50],
    },
    success: {
      bg: colors.status.success,
      hover: "#059669",
      text: colors.gray[50],
    },
  },
} as const;
