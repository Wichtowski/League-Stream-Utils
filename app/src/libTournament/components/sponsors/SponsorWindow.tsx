import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Sponsorship } from "@libTournament/types";

interface SponsorWindowProps {
  sponsors: Sponsorship[];
  fixed?: boolean;
  showName?: boolean;
  namePosition?: "top" | "bottom";
  variant?: "corner" | "banner";
  onIndexChange?: (index: number) => void;
}

export const SponsorWindow = ({ sponsors, fixed = true, variant = "corner", onIndexChange }: SponsorWindowProps): React.ReactElement => {
  const hasList = Array.isArray(sponsors) && sponsors.length > 0;
  const [index, setIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef<number>(0);
  const onIndexChangeRef = useRef<SponsorWindowProps["onIndexChange"]>(undefined);

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
      <div className={`${fixed ? "fixed bottom-4 left-4" : ""} w-64 h-32 bg-black bg-opacity-50 rounded-lg`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white text-center">
            <p className="text-sm">No sponsors available</p>
          </div>
        </div>
      </div>
    );
  }

  const baseClass = variant === "banner" ? `${fixed ? "fixed bottom-4 left-1/2 -translate-x-1/2" : ""} w-[560px] h-40 bg-black bg-opacity-60 rounded-xl` : `${fixed ? "fixed bottom-0 left-0" : ""} w-78 h-39 bg-black bg-opacity-50`;

  return (
    <div className={baseClass}>
      <div
        className={`w-full h-full flex items-center justify-center transition-opacity duration-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div className={`flex ${variant === "banner" ? "flex-row items-center gap-4 px-4" : "flex-col items-center gap-2"}`}>
          {activeSponsor.showName && activeSponsor.namePosition === "top" && (
            <span className="text-white text-sm font-semibold text-center">{activeSponsor.name}</span>
          )}

          {activeSponsor.logo.type === "url" ? (
            <Image
              width={variant === "banner" ? 192 : 128}
              height={variant === "banner" ? 192 : 128}
              src={activeSponsor.logo.url}
              alt={activeSponsor.name}
              className={`${variant === "banner" ? "max-w-48 max-h-32" : (activeSponsor.fullwidth ?? false) ? "w-full h-full object-cover" : "max-w-32 max-h-32"} object-contain`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          ) : (
            <Image
              width={variant === "banner" ? 192 : 128}
              height={variant === "banner" ? 192 : 128}
              src={`data:image/${activeSponsor.logo.format};base64,${activeSponsor.logo.data}`}
              alt={activeSponsor.name}
              className={`${variant === "banner" ? "max-w-48 max-h-32" : (activeSponsor.fullwidth ?? false) ? "w-full h-full object-cover" : "max-w-32 max-h-32"} object-contain`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          )}

          {activeSponsor.showName && activeSponsor.namePosition === "bottom" && (
            <span className={`text-white font-semibold text-center ${variant === "banner" ? "text-base" : "text-sm"}`}>{activeSponsor.name}</span>
          )}
        </div>
      </div>
    </div>
  );
};
