"use client";

import React from "react";
import type { EnhancedChampSelectSession } from "@lib/types";
import { TournamentHeader, TeamSection, MatchInfo, TeamBans } from ".";
import { TimeBar } from "./TimeBar";
import { MockControlPanel } from "./MockControlPanel";
import { ChampSelectLayout } from "./ChampSelectLayout";
import { FearlessDraftBans } from "./FearlessDraftBans";
import { blueColor, redColor } from "@lib/utils/constants";

interface ChampSelectDisplayProps {
  data: EnhancedChampSelectSession;
  isOverlay?: boolean;
  showControls?: boolean;
  onToggleControls?: () => void;
}

const ChampSelectDisplayComponent: React.FC<ChampSelectDisplayProps> = ({
  data,
  isOverlay = false,
  showControls = false,
  onToggleControls
}) => {
  const { myTeam, theirTeam, tournamentData, bans, timer, hoverState } = data;

  const content = (
    <>
      <TournamentHeader tournamentData={tournamentData} timer={timer} />

      {/* Coaches */}
      <div className="flex justify-between mb-4">
        {tournamentData?.blueTeam?.coach && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">COACH</div>
              <div className="font-semibold text-white">{tournamentData.blueTeam.coach.name}</div>
            </div>
          </div>
        )}
        {tournamentData?.redTeam?.coach && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">COACH</div>
              <div className="font-semibold text-white">{tournamentData.redTeam.coach.name}</div>
            </div>
          </div>
        )}
      </div>

      <ChampSelectLayout
        above={
          <>
            <div className="flex justify-between mb-2 items-center">
              <TeamBans
                bans={bans.myTeamBans}
                teamColor={tournamentData?.blueTeam?.colors?.primary || blueColor}
                isFearlessDraft={data.isFearlessDraft}
                usedChampions={data.usedChampions}
                hoverState={hoverState}
              />
              {data.isFearlessDraft && data.fearlessBans && (
                <FearlessDraftBans
                  bans={data.fearlessBans}
                  customTeamColors={{
                    blueTeam: tournamentData?.blueTeam?.colors?.primary || blueColor,
                    redTeam: tournamentData?.redTeam?.colors?.primary || redColor
                  }}
                />
              )}
              <TeamBans
                bans={bans.theirTeamBans}
                teamColor={tournamentData?.redTeam?.colors?.primary || redColor}
                isFearlessDraft={data.isFearlessDraft}
                usedChampions={data.usedChampions}
                hoverState={hoverState}
              />
            </div>
            <TimeBar timer={timer} tournamentData={tournamentData} hoverState={hoverState} />
          </>
        }
        left={
          <TeamSection
            team={myTeam}
            bans={{
              blueTeamBans: bans.myTeamBans,
              redTeamBans: bans.theirTeamBans
            }}
            teamColor={tournamentData?.blueTeam?.colors?.primary || blueColor}
            currentPhase={data.phase}
            hoverState={hoverState}
          />
        }
        center={
          tournamentData ? (
            <MatchInfo
              blueTeam={tournamentData.blueTeam}
              redTeam={tournamentData.redTeam}
              tournamentLogo={tournamentData.tournament?.logoUrl || ""}
              timer={timer.adjustedTimeLeftInPhase}
              maxTimer={timer.totalTimeInPhase}
              isBO3={true}
              blueScore={1}
              redScore={0}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="text-2xl font-bold mb-2">Champion Select</div>
              </div>
            </div>
          )
        }
        right={
          <TeamSection
            team={theirTeam}
            bans={{
              blueTeamBans: bans.myTeamBans,
              redTeamBans: bans.theirTeamBans
            }}
            teamColor={tournamentData?.redTeam?.colors?.primary || redColor}
            currentPhase={data.phase}
            hoverState={hoverState}
          />
        }
      />
    </>
  );

  if (isOverlay) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-transparent">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="fixed bottom-0 left-0 w-full z-10">{content}</div>

        {onToggleControls && <MockControlPanel isVisible={showControls} onToggle={onToggleControls} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Dynamic Mock Demo</h1>
          <p className="text-gray-300 text-lg">
            This demo showcases the dynamic pick/ban mock system with real-time updates
          </p>
        </div>
        <div className="w-full">{content}</div>
      </div>

      {onToggleControls && <MockControlPanel isVisible={showControls} onToggle={onToggleControls} />}
    </div>
  );
};

const ChampSelectDisplay = React.memo(ChampSelectDisplayComponent);

export { ChampSelectDisplay };
