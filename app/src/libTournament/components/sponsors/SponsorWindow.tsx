import Image from "next/image";
import { Sponsorship } from "@libTournament/types";

interface SponsorWindowProps {
  currentSponsor?: Sponsorship;
  fixed?: boolean;
  showName?: boolean;
  namePosition?: "top" | "bottom";
  variant?: "corner" | "banner";
}

export const SponsorWindow = ({ currentSponsor, fixed = true, variant = "corner" }: SponsorWindowProps) => {
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

  const baseClass = variant === "banner" ? `${fixed ? "fixed bottom-4 left-1/2 -translate-x-1/2" : ""} w-[560px] h-40 bg-black bg-opacity-60 rounded-xl` : `${fixed ? "fixed bottom-0 left-0" : ""} w-78 h-39 bg-black bg-opacity-50`;

  return (
    <div className={baseClass}>
      <div
        className={`w-full h-full flex items-center justify-center transition-opacity duration-1000`}
      >
        <div className={`flex ${variant === "banner" ? "flex-row items-center gap-4 px-4" : "flex-col items-center gap-2"}`}>
          {currentSponsor.showName && currentSponsor.namePosition === "top" && (
            <span className="text-white text-sm font-semibold text-center">{currentSponsor.name}</span>
          )}

          {currentSponsor.logo.type === "url" ? (
            <Image
              width={variant === "banner" ? 192 : 128}
              height={variant === "banner" ? 192 : 128}
              src={currentSponsor.logo.url}
              alt={currentSponsor.name}
              className={`${variant === "banner" ? "max-w-48 max-h-32" : (currentSponsor.fullwidth ?? false) ? "w-full h-full object-cover" : "max-w-32 max-h-32"} object-contain`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          ) : (
            <Image
              width={variant === "banner" ? 192 : 128}
              height={variant === "banner" ? 192 : 128}
              src={`data:image/${currentSponsor.logo.format};base64,${currentSponsor.logo.data}`}
              alt={currentSponsor.name}
              className={`${variant === "banner" ? "max-w-48 max-h-32" : (currentSponsor.fullwidth ?? false) ? "w-full h-full object-cover" : "max-w-32 max-h-32"} object-contain`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          )}

          {currentSponsor.showName && currentSponsor.namePosition === "bottom" && (
            <span className={`text-white font-semibold text-center ${variant === "banner" ? "text-base" : "text-sm"}`}>{currentSponsor.name}</span>
          )}
        </div>
      </div>
    </div>
  );
};
