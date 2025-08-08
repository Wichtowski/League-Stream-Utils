"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface CameraNavigationProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  showHub?: boolean;
  showTeamView?: boolean;
  teamId?: string;
  customButtons?: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  }>;
}

export const CameraNavigation = ({
  position = "top-right",
  showHub = true,
  showTeamView = false,
  teamId,
  customButtons = []
}: CameraNavigationProps): React.ReactElement => {
  const router = useRouter();

  const positionClasses = {
    "top-right": "absolute top-4 right-4 z-10",
    "top-left": "absolute top-4 left-4 z-10",
    "bottom-right": "absolute bottom-4 right-4 z-10",
    "bottom-left": "absolute bottom-4 left-4 z-10"
  };

  const buttonVariants = {
    primary: "bg-blue-600 hover:bg-blue-700",
    secondary: "bg-gray-600 hover:bg-gray-700"
  };

  return (
    <div className={`${positionClasses[position]} flex space-x-2`}>
      {showTeamView && teamId && (
        <button
          onClick={() => router.push(`/modules/cameras/stream/${teamId}`)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
        >
          Team View
        </button>
      )}

      {showHub && (
        <button
          onClick={() => router.push("/modules/cameras")}
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
        >
          Camera Hub
        </button>
      )}

      {customButtons.map((button, index) => (
        <button
          key={index}
          onClick={button.onClick}
          className={`${buttonVariants[button.variant || "secondary"]} text-white px-3 py-2 rounded-lg text-sm transition-colors`}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
};
