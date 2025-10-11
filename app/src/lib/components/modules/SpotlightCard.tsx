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

  return (
    <div
      className={`group relative rounded-xl border border-white/10 bg-gray-800/50 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:scale-105 ${className}`}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 bg-gradient-to-br ${module.color} rounded-lg flex items-center justify-center text-2xl`}
        >
          {typeof module.icon === 'string' ? module.icon : <module.icon className="w-6 h-6" />}
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
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">
        {isHiddenBehindTournament && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Current Tournament: {tournamentName}</span>
          </div>
        )}
        {module.name}
      </h3>
      <p className="text-gray-300 text-sm leading-relaxed">{module.description}</p>
    </div>
  );
};
