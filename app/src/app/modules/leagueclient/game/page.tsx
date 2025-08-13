"use client";

import React, { useEffect, useState } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { LiveGameOverlay } from "@lib/components/features/leagueclient/game/LiveGameOverlay";

const LiveGamePage: React.FC = () => {
  const { setActiveModule } = useNavigation();

  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);

  return (
    <>
      <LiveGameOverlay />
    </>
  );
};

export default LiveGamePage;
