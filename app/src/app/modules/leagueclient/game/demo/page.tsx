"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LiveGameData } from "@libLeagueClient/types";
import { GameDataDisplay } from "@libLeagueClient/components/game/GameDataDisplay";
import { Breadcrumbs } from "@lib/components/common";
import { getChampions } from "@lib/champions";
import { getSummonerSpells } from "@lib/summoner-spells";
import { staticPlayersOrderMock, staticPlayersChaosMock, MockedRiotEvents } from "@lib/mocks/game";
import { mockMatch, mockTournament } from "@lib/mocks/game";

const makeLiveGameData = (elapsedSeconds: number): LiveGameData => {
  return {
    gameData: {
      gameMode: "CLASSIC",
      mapName: "Summoner's Rift",
      gameTime: elapsedSeconds,
      gameLength: elapsedSeconds,
      gameStartTime: Math.floor(Date.now() / 1000) - elapsedSeconds
    },
    allPlayers: [...staticPlayersOrderMock, ...staticPlayersChaosMock],
    events: MockedRiotEvents
  };
};

const DemoGamePage: React.FC = () => {
  const [mockData, setMockData] = useState<LiveGameData | null>(null);
  const startTime = useMemo<number>(() => Date.now(), []);

  useEffect(() => {
    const init = async (): Promise<void> => {
      await Promise.allSettled([getChampions(), getSummonerSpells()]);
      // Start demo at minute 7 (420 seconds) - voidgrubs are about to spawn
      setMockData(makeLiveGameData(420));
    };
    init().catch(console.error);

    const interval = setInterval(() => {
      const elapsed = Math.max(420, Math.floor((Date.now() - startTime) / 1000) + 420);
      setMockData(makeLiveGameData(elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!mockData) {
    return <></>;
  }

  return (
    <>
      <GameDataDisplay gameData={mockData} match={mockMatch} tournament={mockTournament} />
      <div className="absolute left-2 bottom-1/4 z-200 w-[600px]">
        <Breadcrumbs
          className="bg-black absolute left-4 bottom-1/12 rounded z-10 p-4"
          items={[
            { label: "League Client", href: "/modules/leagueclient" },
            { label: "Game", href: "/modules/leagueclient/game" },
            { label: "Demo", href: "/modules/leagueclient/game/demo", isActive: true }
          ]}
        />
      </div>
    </>
  );
};

export default DemoGamePage;
