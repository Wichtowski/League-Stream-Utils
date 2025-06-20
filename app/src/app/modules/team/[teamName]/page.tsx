'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Player {
  name: string;
  url: string;
}

export default function TeamStream() {
  const router = useRouter();
  const params = useParams();
  const teamName = params.teamName as string;
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (teamName) {
      const saved = localStorage.getItem(teamName);
      if (saved) {
        setPlayers(JSON.parse(saved));
      } else {
        router.push('/modules/cameras');
      }
    }
  }, [teamName, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % players.length);
    }, 10000); // cycle every 10s

    return () => clearInterval(interval);
  }, [players]);

  if (players.length === 0) {
    return <div className="text-white p-4">Loading team data...</div>;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[1920px] aspect-video relative">
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
          <h1 className="text-3xl font-bold text-white text-center">
            {teamName} - {players[currentIndex].name}
          </h1>
        </div>
        <iframe
          src={players[currentIndex].url}
          allow="camera; microphone; fullscreen"
          className="w-full h-full border-4 border-gray-800 rounded-lg shadow-2xl"
          title={players[currentIndex].name}
          allowFullScreen
          style={{ aspectRatio: '16/9' }}
        />
      </div>
    </div>
  );
} 