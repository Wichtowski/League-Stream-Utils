"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface ConditionalLayoutProps {
  children: ReactNode;
  obsContent: ReactNode;
}

export function ConditionalLayout({ children, obsContent }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isObsRoute = pathname.includes("/obs/");

  if (isObsRoute) {
    return <>{obsContent}</>;
  }

  return <>{children}</>;
}
