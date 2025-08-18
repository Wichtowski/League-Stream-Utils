"use client";

import React, { useEffect } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { GameOverlay } from "@/lib/components/features/leagueclient/game";

const LiveGamePage: React.FC = () => {
  const { setActiveModule } = useNavigation();

  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);

  return <GameOverlay />;
};

export default LiveGamePage;
