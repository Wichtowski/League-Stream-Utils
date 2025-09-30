"use client";

import Image from "next/image";
import { Sponsorship } from "@libTournament/types";

interface SponsorBannerWindowProps {
  currentSponsor?: Sponsorship;
  isVisible: boolean;
  fixed?: boolean;
}

export const SponsorBannerWindow = ({ currentSponsor, isVisible, fixed = true }: SponsorBannerWindowProps): JSX.Element => {
  if (!currentSponsor) {
    return (
      <div className={`${fixed ? "fixed bottom-4 left-1/2 -translate-x-1/2" : ""} w-[560px] h-40 bg-black bg-opacity-60 rounded-xl`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white text-center">
            <p className="text-sm">No sponsors available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fixed ? "fixed bottom-4 left-1/2 -translate-x-1/2" : ""} w-[560px] h-40 bg-black bg-opacity-60 rounded-xl`}>
      <div
        className={`w-full h-full flex items-center justify-center transition-opacity duration-1000 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-row items-center gap-4 px-4">
          {currentSponsor.logo.type === "url" ? (
            <Image
              width={192}
              height={192}
              src={currentSponsor.logo.url}
              alt={currentSponsor.name}
              className="max-w-48 max-h-32 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          ) : (
            <Image
              width={192}
              height={192}
              src={`data:image/${currentSponsor.logo.format};base64,${currentSponsor.logo.data}`}
              alt={currentSponsor.name}
              className="max-w-48 max-h-32 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          )}

          {currentSponsor.name && (
            <span className="text-white font-semibold text-base text-center">{currentSponsor.name}</span>
          )}
        </div>
      </div>
    </div>
  );
};


