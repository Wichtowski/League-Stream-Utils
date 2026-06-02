"use client";

import React, { MouseEvent as ReactMouseEvent } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ModuleCard } from "@lib/navigation";

interface SpotlightCardProps {
  module: ModuleCard;
  className?: string;
  spotlightColor?: string;
  onClick?: () => void;
  isHiddenBehindTournament?: boolean;
  tournamentName?: string;
  loading?: boolean;
}

export const isHiddenBehindTournament = (moduleId: string) =>
  moduleId === "matches" ||
  moduleId === "commentators" ||
  moduleId === "sponsors" ||
  moduleId === "currentMatch" ||
  moduleId === "currentTournament" ||
  moduleId === "ticker";

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  module,
  className = "",
  onClick,
  isHiddenBehindTournament,
  tournamentName,
  loading = false
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: ReactMouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const background = useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, ${module.spotlightColor}, transparent 80%)`;
  const reversedColor = module.color.split(" ").reverse().join(" ");

  if (loading) {
    return (
      <div
        className={`group relative rounded-xl border border-white/10 bg-gray-800/50 backdrop-blur-sm shadow-2xl min-h-48 pointer-events-none animate-pulse p-6 ${className}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gray-700/70 rounded-lg" />
          <div className="flex items-center space-x-2" />
        </div>
        <div className="h-6 w-2/3 bg-gray-700/70 rounded mb-2" />
        <div className="h-4 w-full bg-gray-700/50 rounded" />
      </div>
    );
  }

  const isUnavailable = module.status === "unavailable";

  return (
    <div
      className={`group relative rounded-xl border border-white/10 bg-gray-800/50 backdrop-blur-sm shadow-2xl transition-all duration-300 ${
        isUnavailable ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
      } ${className}`}
      onMouseMove={isUnavailable ? undefined : handleMouseMove}
      onClick={isUnavailable ? undefined : onClick}
    >
      {!isUnavailable && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{ background }}
        />
      )}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 bg-gradient-to-br ${
            isUnavailable ? "from-gray-500 to-gray-600" : module.color
          } rounded-lg flex items-center justify-center text-2xl`}
        >
          {typeof module.icon === "string" ? module.icon : <module.icon className="w-6 h-6" />}
        </div>
        <div className="flex items-center space-x-2">
          {module.status === "beta" && (
            <span className={`bg-gradient-to-br ${reversedColor} text-white px-2 py-1 rounded text-xs font-semibold`}>
              BETA
            </span>
          )}
          {module.status === "new" && (
            <span className={`bg-gradient-to-br ${reversedColor} text-white px-2 py-1 rounded text-xs font-semibold`}>
              NEW
            </span>
          )}
          {module.status === "revamped" && (
            <span className={`bg-gradient-to-br ${reversedColor} text-white px-2 py-1 rounded text-xs font-semibold`}>
              REVAMPED
            </span>
          )}
          {module.status === "coming-soon" && (
            <span
              className={`bg-gradient-to-br ${reversedColor} text-white px-2 py-1 rounded text-xs font-semibold disabled`}
            >
              COMING SOON
            </span>
          )}
          {module.status === "unavailable" && (
            <span className={`bg-gradient-to-br ${reversedColor} text-white px-2 py-1 rounded text-xs font-semibold`}>
              UNAVAILABLE
            </span>
          )}
        </div>
      </div>
      <h3 className={`text-xl font-bold mb-2 ${isUnavailable ? "text-gray-500" : "text-white"}`}>
        {isHiddenBehindTournament && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Current Tournament: {tournamentName}</span>
          </div>
        )}
        {module.name}
      </h3>
      <p className={`text-sm leading-relaxed ${isUnavailable ? "text-gray-500" : "text-gray-300"}`}>
        {module.description}
      </p>
    </div>
  );
};
