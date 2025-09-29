import { colors, colorCombinations, withOpacity } from "../theme/colors";
import { ButtonVariant } from "../components/common/button/Button";

export const useTheme = () => {
  return {
    colors,
    combinations: colorCombinations,
    withOpacity,

    // Convenience methods for common patterns
    getButtonColors: (variant: ButtonVariant) => {
      return colorCombinations.button[variant];
    },

    getCardColors: (variant: "dark" | "game") => {
      return variant === "dark" ? colorCombinations.darkCard : colorCombinations.gameCard;
    },

    getStatusColor: (status: "success" | "warning" | "error" | "info") => {
      return colors.status[status];
    },

    getCameraColor: (state: "live" | "offline" | "error") => {
      return colors.camera[state];
    },

    getTeamColor: (team: "blue" | "red", shade: "light" | "default" | "dark" = "default") => {
      return colors.team[team][shade];
    }
  };
};
