"use client";

import { ReactNode } from "react";
import "./globals.css";

interface ObsLayoutProps {
  children: ReactNode;
}

export default function ObsLayout({ children }: ObsLayoutProps): ReactNode {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden">
      {children}
    </div>
  );
}
