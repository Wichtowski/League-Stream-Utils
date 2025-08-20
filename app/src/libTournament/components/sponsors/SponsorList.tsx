"use client";

import Image from "next/image";
import type { Sponsorship } from "@lib/types";

interface SponsorListProps {
  sponsors: Sponsorship[];
  loading: boolean;
  onEditSponsor: (sponsor: Sponsorship) => void;
  onDeleteSponsor: (sponsor: Sponsorship) => void;
}

export const SponsorList = ({ sponsors, loading, onEditSponsor, onDeleteSponsor }: SponsorListProps) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Current Sponsors ({sponsors.length})</h3>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-gray-400">Loading sponsors...</p>
        </div>
      ) : sponsors.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No sponsors added yet.</p>
          <p className="text-sm">Add your first sponsor to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    sponsor.tier === "title"
                      ? "bg-yellow-600 text-yellow-100"
                      : sponsor.tier === "presenting"
                        ? "bg-purple-600 text-purple-100"
                        : sponsor.tier === "official"
                          ? "bg-blue-600 text-blue-100"
                          : "bg-gray-600 text-gray-100"
                  }`}
                >
                  {sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1)}
                </span>
                <span className="text-xs text-gray-400">Priority: {sponsor.displayPriority}</span>
              </div>

              <div className="text-center mb-3">
                {sponsor.logo.type === "url" ? (
                  <Image
                    src={sponsor.logo.url}
                    alt={sponsor.name}
                    width={128}
                    height={64}
                    className="max-w-32 max-h-16 mx-auto object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <Image
                    src={`data:image/${sponsor.logo.format};base64,${sponsor.logo.data}`}
                    alt={sponsor.name}
                    width={128}
                    height={64}
                    className="max-w-32 max-h-16 mx-auto object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                )}
              </div>

              <h4 className="font-semibold text-center mb-1">{sponsor.name}</h4>
              {sponsor.website && <p className="text-xs text-gray-400 text-center mb-3">{sponsor.website}</p>}

              <div className="text-xs text-gray-400 mb-3">
                <p>Show name: {sponsor.showName ? "Yes" : "No"}</p>
                {sponsor.showName && <p>Position: {sponsor.namePosition === "left" ? "Left" : "Right"}</p>}
                <p>Fill container: {sponsor.fillContainer ? "Yes" : "No"}</p>
              </div>

              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => onEditSponsor(sponsor)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteSponsor(sponsor)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
