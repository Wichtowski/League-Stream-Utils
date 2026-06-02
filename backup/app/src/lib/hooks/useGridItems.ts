import { useState, useEffect } from "react";

interface GridConfig {
  mobile: number;
  sm: number;
  lg: number;
  xl: number;
}

/**
 * Hook that calculates the number of items to display in a grid based on screen width
 * @param config - Grid configuration with columns for different breakpoints
 * @param rows - Number of rows to display (default: 3)
 * @param columns - Number of columns to display (default: 4)
 * @returns Number of items to show in the grid
 *
 * Breakpoints:
 * - mobile: < 640px (1 column)
 * - sm: 640px - 1023px (2 columns)
 * - lg: 1024px - 1279px (3 columns)
 * - xl: >= 1280px (4 columns)
 */
export const useGridItems = (config: GridConfig, rows: number = 3): number => {
  const [itemCount, setItemCount] = useState<number>(config.xl * rows);

  useEffect(() => {
    const updateItemCount = (): void => {
      const width = window.innerWidth;

      if (width < 640) {
        // Mobile: 1 column
        setItemCount(config.mobile * rows);
      } else if (width < 1024) {
        // Small screens: 2 columns
        setItemCount(config.sm * rows);
      } else if (width < 1280) {
        // Large screens: 3 columns
        setItemCount(config.lg * rows);
      } else {
        // Extra large screens: 4 columns
        setItemCount(config.xl * rows);
      }
    };

    updateItemCount();
    window.addEventListener("resize", updateItemCount);

    return () => {
      window.removeEventListener("resize", updateItemCount);
    };
  }, [config, rows]);

  return itemCount;
};

// Predefined grid configurations for common use cases
export const GRID_CONFIGS = {
  teams: { mobile: 1, sm: 2, lg: 3, xl: 4 },
  tournaments: { mobile: 1, sm: 2, lg: 3, xl: 4 },
  matches: { mobile: 1, sm: 2, lg: 3, xl: 4 },
  players: { mobile: 1, sm: 2, lg: 3, xl: 4 },
  modules: { mobile: 1, sm: 2, lg: 3, xl: 4 }
} as const;
