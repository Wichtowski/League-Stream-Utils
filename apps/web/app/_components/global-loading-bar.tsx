"use client";

import { useIsFetching, useIsMutating } from "@tanstack/react-query";

export function GlobalLoadingBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching > 0 || mutating > 0;

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </div>
  );
}
