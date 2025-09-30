"use client";

import Image from "next/image";
import { getImageSrc } from "@lib/services/common/image";
import type { Sponsorship } from "@libTournament/types";

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
            <div key={sponsor._id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    sponsor.tier === "platinum"
                      ? "bg-purple-600 text-purple-100"
                      : sponsor.tier === "gold"
                        ? "bg-yellow-600 text-yellow-100"
                        : sponsor.tier === "silver"
                          ? "bg-gray-400 text-gray-100"
                          : "bg-amber-600 text-amber-100"
                  }`}
                >
                  {sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1)}
                </span>
              </div>

              <div className="text-center mb-3">
                <Image
                  src={getImageSrc(sponsor.logo)}
                  alt={sponsor.name}
                  width={256}
                  height={128}
                  className="max-w-64 max-h-32 mx-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>

              <h4 className="font-semibold text-center mb-3">{sponsor.name}</h4>

              <div className="space-y-1 text-sm w-32 ml-12">
                {sponsor.showName && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Show Name:</span>
                    <span className="text-white">Yes</span>
                  </div>
                )}
                
                {sponsor.timeInSeconds && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">{sponsor.timeInSeconds}s</span>
                  </div>
                )}
                
                {sponsor.namePosition && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Position:</span>
                    <span className="text-white capitalize">{sponsor.namePosition}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Fullwidth:</span>
                  <span className="text-white">{sponsor.fullwidth ? "Yes" : "No"}</span>
                </div>
                
                {sponsor.variant && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Variant:</span>
                    <span className="text-white capitalize">{sponsor.variant}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
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
