"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { LiveGameData, GameEvent } from "@lib/services/game/game-service";
import { GameDataDisplay } from "@/lib/components/features/leagueclient/game/GameDataDisplay";
import { Breadcrumbs } from "@lib/components/common/Breadcrumbs";
import { getChampions } from "@lib/champions";
import { getSummonerSpells } from "@lib/summoner-spells";
import { staticPlayersOrderMock, staticPlayersChaosMock, MockedEvents } from "@lib/mocks/game";



const makeLiveGameData = (elapsedSeconds: number): LiveGameData => {
  return {
    gameData: {
      gameMode: "CLASSIC",
      mapName: "Summoner's Rift",
      gameTime: elapsedSeconds,
      gameLength: elapsedSeconds,
      gameStartTime: Math.floor(Date.now() / 1000) - elapsedSeconds
    },
    allPlayers: [ ...staticPlayersOrderMock, ...staticPlayersChaosMock ],
    events: MockedEvents
  };
};

const DemoGamePage: React.FC = () => {
  const [mockData, setMockData] = useState<LiveGameData | null>(null);
  const startTime = useMemo<number>(() => Date.now(), []);

  useEffect(() => {
    const init = async (): Promise<void> => {
      await Promise.allSettled([getChampions(), getSummonerSpells()]);
      setMockData(makeLiveGameData(0));
    };
    init().catch(console.error);

    const interval = setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setMockData(makeLiveGameData(elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!mockData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading demo...</div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 p-4">
        <Breadcrumbs
          items={[
            { label: "League Client", href: "/modules/leagueclient" },
            { label: "Game", href: "/modules/leagueclient/game" },
            { label: "Demo", href: "/modules/leagueclient/game/demo", isActive: true }
          ]}
        />
      </div>
      <GameDataDisplay gameData={mockData} />
    </>
  );
};

export default DemoGamePage;


