import { useState, useCallback } from "react";
import { useModal } from "@lib/contexts";
import { extractTeamColorsFromImage } from "@lib/services/common/image";
import type { TeamColors } from "@libTeam/types";

interface UseTeamColorsProps {
  initialColors?: TeamColors;
  onColorsChange: (colors: TeamColors) => void;
}

export const useTeamColors = ({ initialColors, onColorsChange }: UseTeamColorsProps) => {
  const { showAlert } = useModal();
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [useManualColors, setUseManualColors] = useState(false);

  const generateColorsFromLogo = useCallback(async (logoPreview: string): Promise<void> => {
    if (!logoPreview) return;
    try {
      const colors = await extractTeamColorsFromImage(logoPreview);
      setExtractedColors(colors);
      setUseManualColors(false);

      if (colors.length >= 3) {
        const newColors: TeamColors = {
          ...initialColors!,
          primary: colors[0],
          secondary: colors[1],
          accent: colors[2]
        };
        onColorsChange(newColors);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate colors from logo";
      await showAlert({ type: "warning", message: errorMessage });
    }
  }, [initialColors, onColorsChange, showAlert]);

  const handleColorChange = useCallback((colorType: keyof TeamColors, value: string): void => {
    const newColors: TeamColors = {
      ...initialColors!,
      [colorType]: value
    };
    onColorsChange(newColors);
  }, [initialColors, onColorsChange]);

  const toggleColorMode = useCallback((): void => {
    setUseManualColors(!useManualColors);
  }, [useManualColors]);

  return {
    extractedColors,
    useManualColors,
    generateColorsFromLogo,
    handleColorChange,
    toggleColorMode
  };
};
