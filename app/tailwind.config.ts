import type { Config } from "tailwindcss";
import { colors } from "@lib/theme/colors";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Override default colors with our custom scheme
        primary: colors.primary,
        gray: colors.gray,

        // Add custom color groups
        accent: colors.accent,
        team: colors.team,
        status: colors.status,
        camera: colors.camera,
        bracket: colors.bracket,

        // Semantic color aliases for better DX
        background: colors.gray[900],
        "background-dark": colors.gray[950],
        "background-card": colors.gray[800],
        "background-card-dark": colors.gray[850],

        foreground: colors.gray[50],
        "foreground-muted": colors.gray[400],

        border: colors.gray[700],
        "border-light": colors.gray[600],
        "border-dark": colors.gray[800],

        // Gaming specific
        "game-accent": colors.accent["game-green"],
        gold: colors.accent.gold,
        "gold-dark": colors.accent["gold-dark"]
      },

      // Custom spacing for gaming UI
      spacing: {
        "18": "4.5rem",
        "88": "22rem"
      },

      // Custom border radius for modern gaming look
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem"
      },

      // Gaming fonts
      fontFamily: {
        game: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"]
      },

      // Animations for gaming elements
      animation: {
        glow: "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.3s ease-out"
      },

      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px theme(colors.primary.500)" },
          "100%": {
            boxShadow: "0 0 20px theme(colors.primary.500), 0 0 30px theme(colors.primary.500)"
          }
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        }
      },

      // Gaming box shadows
      boxShadow: {
        game: "0 4px 20px rgba(0, 0, 0, 0.5)",
        "game-hover": "0 8px 30px rgba(0, 0, 0, 0.7)",
        neon: "0 0 10px theme(colors.primary.500)",
        "neon-strong": "0 0 20px theme(colors.primary.500), 0 0 40px theme(colors.primary.500)"
      }
    }
  },
  plugins: []
} satisfies Config;

export default config;
