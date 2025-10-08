"use client";

import { useEffect, useRef, useState } from "react";
import { Sponsorship } from "@libTournament/types";
import { SafeImage } from "@lib/components/common/SafeImage";
import { getImageSrc } from "@lib/services/common/image";

interface SponsorWithinTickerProps {
  sponsors: Sponsorship[];
  onIndexChange?: (index: number) => void;
  className?: string;
}

export const SponsorWithinTicker = ({ 
  sponsors, 
  onIndexChange, 
  className = "" 
}: SponsorWithinTickerProps): React.ReactElement => {
  const hasList = Array.isArray(sponsors) && sponsors.length > 0;
  const [index, setIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef<number>(0);
  const onIndexChangeRef = useRef<SponsorWithinTickerProps["onIndexChange"]>(undefined);

  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange]);

  useEffect(() => {
    if (!hasList) return;

    indexRef.current = Math.min(indexRef.current, (sponsors as Sponsorship[]).length - 1);
    setIndex(indexRef.current);
    if (onIndexChangeRef.current) onIndexChangeRef.current(indexRef.current);
    setIsVisible(true);

    const fadeOutDuration = 1000;

    const scheduleNext = (): void => {
      const list = sponsors as Sponsorship[];
      if (!list || list.length === 0) return;
      const current = list[indexRef.current];
      const displaySeconds = Math.max(1, current.timeInSeconds ?? 3);
      const displayDuration = displaySeconds * 1000;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          const listInner = sponsors as Sponsorship[];
          if (!listInner || listInner.length === 0) return;
          indexRef.current = (indexRef.current + 1) % listInner.length;
          setIndex(indexRef.current);
          if (onIndexChangeRef.current) onIndexChangeRef.current(indexRef.current);
          setIsVisible(true);
          scheduleNext();
        }, fadeOutDuration);
      }, displayDuration);
    };

    scheduleNext();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [hasList, sponsors]);

  const activeSponsor: Sponsorship | undefined = hasList ? sponsors[index] : undefined;

  if (!activeSponsor) {
    return (
      <div className="flex w-[256px] h-[128px] bg-black items-center justify-start">
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-start bg-black ${className}`}>
      <div
        className={`flex items-center justify-start bg-black transition-opacity duration-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex flex-col items-start">
          {activeSponsor.showName && activeSponsor.namePosition === "top" && (
            <span className="text-white text-xs font-semibold text-center">{activeSponsor.name}</span>
          )}

          <div className="w-[256px] h-[128px] flex items-center justify-center">
            <SafeImage
              width={256}
              height={128}
              src={getImageSrc(activeSponsor.logo)}
              alt={activeSponsor.name}
              className={`${activeSponsor.fullwidth ?? false ? "w-full h-full object-cover" : "w-full h-full object-contain"}`}
            //   onError={(e) => {
            //     const target = e.target as HTMLImageElement;
            //     target.style.display = "none";
            //   }}
            />
          </div>

          {activeSponsor.showName && activeSponsor.namePosition === "bottom" && (
            <span className="text-white text-xs font-semibold text-center">{activeSponsor.name}</span>
          )}
        </div>
      </div>
    </div>
  );
};
