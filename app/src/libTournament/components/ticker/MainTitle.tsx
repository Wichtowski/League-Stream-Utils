"use client";

import { useEffect, useState } from "react";

interface MainTitleProps {
  title: string;
  displayDuration: number; // in seconds
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

export const MainTitle = ({ title, displayDuration, isVisible, onAnimationComplete }: MainTitleProps) => {
  const [animationState, setAnimationState] = useState<"fade-in" | "visible" | "fade-out">("fade-in");

  useEffect(() => {
    if (!isVisible) {
      setAnimationState("fade-out");
      return;
    }

    // Start with fade-in
    setAnimationState("fade-in");

    // After fade-in completes (0.5s), stay visible for displayDuration
    const fadeInTimer = setTimeout(() => {
      setAnimationState("visible");

      // After display duration, start fade-out
      const displayTimer = setTimeout(() => {
        setAnimationState("fade-out");

        // After fade-out completes (0.5s), call completion callback
        const fadeOutTimer = setTimeout(() => {
          onAnimationComplete?.();
        }, 500);

        return () => clearTimeout(fadeOutTimer);
      }, displayDuration * 1000);

      return () => clearTimeout(displayTimer);
    }, 500);

    return () => clearTimeout(fadeInTimer);
  }, [isVisible, displayDuration, onAnimationComplete]);

  if (!title.trim()) {
    return null;
  }

  return (
    <div
      className={`
        absolute top-8 left-1/2 transform -translate-x-1/2 z-20
        transition-opacity duration-500 ease-in-out
        ${animationState === "fade-in" ? "opacity-0 animate-fade-in" : ""}
        ${animationState === "visible" ? "opacity-100" : ""}
        ${animationState === "fade-out" ? "opacity-0" : ""}
      `}
      style={{
        animation:
          animationState === "fade-in"
            ? "fadeIn 0.5s ease-in-out forwards"
            : animationState === "fade-out"
              ? "fadeOut 0.5s ease-in-out forwards"
              : "none"
      }}
    >
      <div className="bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-lg px-8 py-4 shadow-2xl border border-gray-600/50">
        <h1 className="text-3xl font-bold text-white text-center tracking-wide drop-shadow-lg">{title}</h1>
      </div>
    </div>
  );
};
