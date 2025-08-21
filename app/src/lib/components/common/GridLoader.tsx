"use client";

import React from "react";
import { useGridItems, GRID_CONFIGS } from "@lib/hooks/useGridItems";

interface GridLoaderProps {
  config?: keyof typeof GRID_CONFIGS | { mobile: number; sm: number; lg: number; xl: number };
  rows?: number;
  className?: string;
  cardClassName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: React.ComponentType<any>;
  componentProps?: Record<string, unknown>;
  placeholderData?: unknown[];
}

export const GridLoader: React.FC<GridLoaderProps> = ({
  config = "teams",
  rows = 3,
  className = "",
  cardClassName = "",
  component: Component,
  componentProps = {},
  placeholderData = []
}) => {
  const gridConfig = typeof config === "string" ? GRID_CONFIGS[config] : config;
  const itemCount = useGridItems(gridConfig, rows);

  // If a component is provided, render it multiple times
  if (Component) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(itemCount)].map((_, index) => {
            const data = placeholderData[index] || {};
            return <Component key={index} index={index} {...componentProps} {...data} />;
          })}
        </div>
      </div>
    );
  }

  // Default skeleton loading behavior
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
        {[...Array(itemCount)].map((_, index) => (
          <div
            key={index}
            className={`group cursor-pointer bg-gray-800 hover:bg-gray-750 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border border-gray-700 hover:border-gray-600 ${cardClassName}`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 blur-sm bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center text-2xl font-bold text-gray-300"></div>
              </div>
              <div className="h-8 bg-gray-600 rounded blur-sm w-32"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
