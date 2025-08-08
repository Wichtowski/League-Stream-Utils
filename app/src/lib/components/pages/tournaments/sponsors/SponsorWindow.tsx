import Image from "next/image";
import type { Sponsorship } from "@lib/types";

interface SponsorWindowProps {
  currentSponsor?: Sponsorship;
  isVisible: boolean;
  fixed?: boolean;
}

export const SponsorWindow = ({ currentSponsor, isVisible, fixed = true }: SponsorWindowProps) => {
  if (!currentSponsor) {
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

  return (
    <div className={`${fixed ? "fixed bottom-0 left-0" : ""} w-78 h-39 bg-black bg-opacity-50`}>
      <div
        className={`w-full h-full flex items-center justify-center transition-opacity duration-1000 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2">
          {currentSponsor.showName && currentSponsor.namePosition === "left" && (
            <span className="text-white text-sm font-semibold whitespace-nowrap">{currentSponsor.name}</span>
          )}

          {currentSponsor.logo.type === "url" ? (
            <Image
              width={128}
              height={128}
              style={{
                width: currentSponsor.fillContainer ? "100%" : "auto",
                height: currentSponsor.fillContainer ? "100%" : "auto",
                padding: currentSponsor.fillContainer ? "0" : "10px"
              }}
              src={currentSponsor.logo.url}
              alt={currentSponsor.name}
              className={
                currentSponsor.fillContainer ? "w-full h-full object-cover" : "max-w-32 max-h-32 object-contain"
              }
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          ) : (
            <Image
              width={128}
              height={128}
              style={{
                width: currentSponsor.fillContainer ? "100%" : "auto",
                height: currentSponsor.fillContainer ? "100%" : "auto",
                padding: currentSponsor.fillContainer ? "0" : "10px"
              }}
              src={`data:image/${currentSponsor.logo.format};base64,${currentSponsor.logo.data}`}
              alt={currentSponsor.name}
              className={
                currentSponsor.fillContainer ? "w-full h-full object-cover" : "max-w-32 max-h-32 object-contain"
              }
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          )}

          {currentSponsor.showName && currentSponsor.namePosition === "right" && (
            <span className="text-white text-sm font-semibold whitespace-nowrap">{currentSponsor.name}</span>
          )}
        </div>
      </div>
    </div>
  );
};
