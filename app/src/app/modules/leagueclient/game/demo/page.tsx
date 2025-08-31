"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LiveGameData } from "@libLeagueClient/types";
import { GameDataDisplay } from "@libLeagueClient/components/game/GameDataDisplay";
import { Breadcrumbs } from "@lib/components/common";
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
    allPlayers: [...staticPlayersOrderMock, ...staticPlayersChaosMock],
    events: MockedEvents
  };
};

const DemoGamePage: React.FC = () => {
  const [mockData, setMockData] = useState<LiveGameData | null>(null);
  const startTime = useMemo<number>(() => Date.now(), []);
  const tournamentId = "c8ca4d50-49e6-4956-9849-a35a83fc737b";
  const matchId = "685726fd0eee50233623f977";

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
    return <></>;
  }

  return (
    <>
      <GameDataDisplay gameData={mockData} matchId={matchId} tournamentId={tournamentId} />
      <Breadcrumbs
        className="absolute left-4 bottom-0 z-10"
        items={[
          { label: "League Client", href: "/modules/leagueclient" },
          { label: "Game", href: "/modules/leagueclient/game" },
          { label: "Demo", href: "/modules/leagueclient/game/demo", isActive: true }
        ]}
      />
    </>
  );
};

export default DemoGamePage;
