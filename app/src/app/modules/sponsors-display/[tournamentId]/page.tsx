'use client';

import { useEffect, useState } from 'react';
import type { Sponsorship } from '@lib/types';
import Image from 'next/image';

interface TournamentInfo {
  id: string;
  name: string;
  abbreviation: string;
}

interface SponsorsDisplayData {
  tournament: TournamentInfo;
  sponsors: Sponsorship[];
}

export default function SponsorsDisplayPage({ params }: { params: { tournamentId: string } }) {
  const [data, setData] = useState<SponsorsDisplayData | null>(null);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSponsors = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/v1/tournaments/${params.tournamentId}/sponsors/display`);
        if (!response.ok) {
          throw new Error('Failed to fetch sponsors');
        }
        const sponsorsData = await response.json();
        setData(sponsorsData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sponsors');
        setLoading(false);
      }
    };

    fetchSponsors();
  }, [params.tournamentId]);

  useEffect(() => {
    if (!data || data.sponsors.length === 0) return;

    const fadeOutDuration = 1000; // 1 second fade out
    const displayDuration = 3000; // 3 seconds display
    const fadeInDuration = 1000; // 1 second fade in
    const totalCycleDuration = fadeOutDuration + displayDuration + fadeInDuration;

    const cycleSponsors = (): void => {
      // Fade out
      setIsVisible(false);
      
      setTimeout(() => {
        // Change sponsor
        setCurrentSponsorIndex((prev) => (prev + 1) % data.sponsors.length);
        
        // Fade in
        setTimeout(() => {
          setIsVisible(true);
        }, 50); // Small delay to ensure DOM update
      }, fadeOutDuration);
    };

    const interval = setInterval(cycleSponsors, totalCycleDuration);

    return () => clearInterval(interval);
  }, [data]);

  if (loading) {
    return (
      <div className="fixed bottom-4 left-4 w-64 h-32 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Loading sponsors...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed bottom-4 left-4 w-64 h-32 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-red-400">Error loading sponsors</p>
          <p className="text-sm text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (data.sponsors.length === 0) {
    return (
      <div className="fixed bottom-4 left-4 w-64 h-32 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
        <div className="text-white text-center">
          <p>No sponsors available</p>
        </div>
      </div>
    );
  }

  const currentSponsor = data.sponsors[currentSponsorIndex];

  return (
    <div className="fixed bottom-4 left-4 w-64 h-32 bg-transparent">
      <div 
        className={`w-full h-full bg-black bg-opacity-50 rounded-lg flex items-center justify-center transition-opacity duration-1000 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="text-center">
          <div className="mb-2">
            {currentSponsor.logo.type === 'url' ? (
              <Image 
                src={currentSponsor.logo.url} 
                alt={currentSponsor.name}
                className="max-w-32 max-h-16 mx-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <Image 
                src={`data:image/${currentSponsor.logo.format};base64,${currentSponsor.logo.data}`}
                alt={currentSponsor.name}
                className="max-w-32 max-h-16 mx-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
          </div>
          <p className="text-white text-sm font-semibold">{currentSponsor.name}</p>
          {currentSponsor.website && (
            <p className="text-gray-300 text-xs">{currentSponsor.website}</p>
          )}
        </div>
      </div>
    </div>
  );
} 