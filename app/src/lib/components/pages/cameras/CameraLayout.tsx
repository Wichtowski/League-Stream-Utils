"use client";

import React from "react";

interface CameraLayoutProps {
  children: React.ReactNode;
  backgroundColor?: "black" | "gray-900";
  className?: string;
}

export const CameraLayout = ({
  children,
  backgroundColor = "black",
  className = "",
}: CameraLayoutProps): React.ReactElement => {
  const bgClass = backgroundColor === "black" ? "bg-black" : "";

  return (
    <div className={`min-h-screen ${bgClass} ${className}`}>{children}</div>
  );
};
