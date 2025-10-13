import React, { useEffect, useState } from "react";
import Image from "next/image";
import { LiveGameData } from "@libLeagueClient/types";
import {
  getChampionSquareImage,
  getDefaultAsset,
  getSummonerSpellImageByName
} from "@libLeagueClient/components/common";
import { getItemImage } from "@lib/items";
import { getRuneImage } from "@lib/runes";
import { MdPlayArrow } from "react-icons/md";

interface LaneHudProps {
  gameData: LiveGameData;
  gameVersion: string;
}

export const LaneHud: React.FC<LaneHudProps> = ({ gameData, gameVersion }): React.ReactElement => {
  const [levelAnimations, setLevelAnimations] = useState<Record<string, boolean>>({});
  const [previousLevels, setPreviousLevels] = useState<Record<string, number>>({});

  useEffect(() => {
    gameData.allPlayers.forEach((p) => {
      const playerKey = p.summonerName;
      const currentLevel = p.level || 1;
      const previousLevel = previousLevels[playerKey] || 1;
      
      if (currentLevel !== previousLevel && currentLevel !== 1) {
        setLevelAnimations(prev => ({ ...prev, [playerKey]: true }));
        setPreviousLevels(prev => ({ ...prev, [playerKey]: currentLevel }));
        
        setTimeout(() => {
          setLevelAnimations(prev => ({ ...prev, [playerKey]: false }));
        }, 4000);
      }
    });
  }, [gameData.allPlayers, previousLevels]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-60">
      <div className="h-full w-full px-3">
        {(() => {
          const laneOrder = ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"] as const;
          type LaneKey = (typeof laneOrder)[number];
          const normalizePosition = (pos: string): LaneKey | null => {
            const p = (pos || "").trim().toUpperCase();
            if (p === "TOP") return "TOP";
            if (p === "JUNGLE" || p === "JNG") return "JUNGLE";
            if (p === "MIDDLE" || p === "MID") return "MID";
            if (p === "BOTTOM" || p === "BOT" || p === "ADC") return "BOTTOM";
            if (p === "SUPPORT" || p === "SUP" || p === "UTILITY") return "SUPPORT";
            return null;
          };

          const orderPlayers = gameData.allPlayers.filter((p) => p.team === "ORDER");
          const chaosPlayers = gameData.allPlayers.filter((p) => p.team === "CHAOS");

          const scoreMatch = (p: (typeof gameData.allPlayers)[number], lane: LaneKey): number => {
            const pos = normalizePosition(p.position);
            if (!pos) return 0;
            if (pos === lane) return 3;
            if ((lane === "MID" && pos === "BOTTOM") || (lane === "BOTTOM" && pos === "MID")) return 1;
            return 0;
          };

          const pickByLaneWithFallback = (
            players: typeof gameData.allPlayers,
            lane: LaneKey,
            used: Set<string>
          ): (typeof gameData.allPlayers)[number] | null => {
            const exact = players.find((p) => !used.has(p.summonerName) && normalizePosition(p.position) === lane);
            if (exact) return exact;
            const candidates = players
              .filter((p) => !used.has(p.summonerName))
              .map((p) => ({ p, s: scoreMatch(p, lane) }))
              .sort((a, b) => b.s - a.s);
            if (candidates.length && candidates[0].s > 0) return candidates[0].p;
            const first = players.find((p) => !used.has(p.summonerName));
            return first || null;
          };

          const renderItems = (items: (typeof gameData.allPlayers)[number]["items"], align: "left" | "right") => {
            const six = Array.from({ length: 6 }).map((_, i) => items?.[i] || null);
            return (
              <div className="flex gap-1">
                {align === "left"
                  ? six.reverse().map((it, idx) => (
                      <div
                        key={idx}
                        className="w-5 h-5 bg-gray-700 rounded border border-gray-600 flex items-center justify-center"
                      >
                        {it ? <Image src={getItemImage(it.itemID)} alt={it.name} width={20} height={20} /> : null}
                      </div>
                    ))
                  : six.map((it, idx) => (
                      <div
                        key={idx}
                        className="w-5 h-5 bg-gray-700 rounded border border-gray-600 flex items-center justify-center"
                      >
                        {it ? <Image src={getItemImage(it.itemID)} alt={it.name} width={20} height={20} /> : null}
                      </div>
                    ))}
              </div>
            );
          };
          const runeAndSpellStyle = "w-6 h-6 bg-gray-700 border border-black flex items-center justify-center"
          
          const renderSpells = (spell: (typeof gameData.allPlayers)[number]["summonerSpells"]) => {
            const s1 = spell?.summonerSpellOne?.displayName;
            const s2 = spell?.summonerSpellTwo?.displayName;
            return (
              <div className="flex flex-col">
                <div className={runeAndSpellStyle}>
                  {s1 ? <Image src={getSummonerSpellImageByName(s1)} alt={s1} width={22} height={22} /> : null}
                </div>
                <div className={runeAndSpellStyle}>
                  {s2 ? <Image src={getSummonerSpellImageByName(s2)} alt={s2} width={22} height={22} /> : null}
                </div>
              </div>
            );
          };
          const renderRunes = (runes: (typeof gameData.allPlayers)[number]["runes"]) => {
            const r1 = runes?.keystone;
            const r2 = runes?.secondaryRuneTree;
            return (
              <div className="flex flex-col">
                <div className={runeAndSpellStyle}>
                  {r1 ? <Image src={getRuneImage(r1)} alt={r1} width={22} height={22} /> : null}
                </div>
                <div className={runeAndSpellStyle}>
                  {r2 ? <Image src={getRuneImage(r2)} alt={r2} width={22} height={22} /> : null}
                </div>
              </div>
            );
          };

          const renderTrinket = (trinketType: number, visionScore: number) => {
            return <div className="w-5 h-5 bg-gray-700 rounded border border-gray-600" />;
          };

          const renderImage = (p: (typeof gameData.allPlayers)[number], align: "left" | "right") => {
            const playerKey = p.summonerName;
            const showLevelAnimation = levelAnimations[playerKey] || false;
            const alignmentClass = align === "left" ? "justify-end" : "justify-start";
            
            return (
              <div className={`relative border-1/2 black rounded flex ${alignmentClass}`}>
                <Image
                  src={getChampionSquareImage(p.championName) || getDefaultAsset(gameVersion, "player.png")}
                  alt={p.championName}
                  width={45}
                  height={45}
                  className={showLevelAnimation ? "opacity-0" : "opacity-100 transition-opacity duration-300"}
                />
                {showLevelAnimation ? (
                  <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <div className="text-white text-3xl font-bold animate-pulse">
                      {p.level || 1}
                    </div>
                  </div>
                ) : (
                  <div className={`absolute bottom-0 ${align === "left" ? "left-[-6px]" : "right-[-6px]"} bg-black/80 text-white text-sm font-bold px-1 ${align === "left" ? "rounded-br" : "rounded-bl"} shadow-lg`}>
                    {p.level || 1}
                    <div className={`absolute ${align === "left" ? "left-0 top-0" : "right-0 top-0"} w-0 h-0 ${align === "left" ? "border-l-0 border-r-4 border-b-4 border-t-0 border-l-transparent border-r-black/80 border-b-black/80 border-t-transparent" : "border-l-4 border-r-0 border-b-4 border-t-0 border-l-black/80 border-r-transparent border-b-black/80 border-t-transparent"}`}></div>
                  </div>
                )}
              </div>
            );
          };

          const renderTexts = (playerScore: (typeof gameData.allPlayers)[number]["scores"], summonerName: string, align: "left" | "right") => {
            return (
              <div className={`flex direction-${align} flex-row gap-1`}>
                <div className="text-xs">
                  <div className="font-semibold truncate max-w-[120px]">{summonerName}</div>
                </div>
                <div className={`flex flex-col items-end ${align === "left" ? "items-start" : "items-end"}`}>
                  <div className="text-orange-200 font-bold text-sm">{playerScore.creepScore ?? 0}</div>
                  {playerScore.kills}/{playerScore.deaths}/{playerScore.assists}
                </div>
              </div>
            );
          };

          const renderPlayerSide = (
            p: (typeof gameData.allPlayers)[number] | undefined | null,
            align: "left" | "right"
          ) => {
            if (!p) return <div className="flex-1" />;
            return (
              <div className={`flex items-center ${align === "left" ? "justify-end" : "justify-start"} flex-1`}>
                {align === "left" ? (
                  <>
                    {renderTrinket(p.items[0].itemID, p.scores.visionScore)}
                    {renderItems(p.items, "left")}
                    {renderRunes(p.runes)}
                    {renderSpells(p.summonerSpells)}
                    {renderTexts(p.scores, p.summonerName, "left")}
                    {renderImage(p, "left")}
                  </>
                ) : (
                  <>
                    {renderImage(p, "right")}
                    {renderTexts(p.scores, p.summonerName, "right")}
                    {renderSpells(p.summonerSpells)}
                    {renderRunes(p.runes)}
                    {renderItems(p.items, "right")}
                    {renderTrinket(p.items[0].itemID, p.scores.visionScore)}
                  </>
                )}
              </div>
            );
          };

          const ChevronLeft = (): React.ReactElement => (
            <MdPlayArrow className="text-blue-500 rotate-180" />
          );

          const ChevronRight = (): React.ReactElement => (
            <MdPlayArrow className="text-red-500" />
          );

          const renderGoldDiff = (
            left?: (typeof gameData.allPlayers)[number] | null,
            right?: (typeof gameData.allPlayers)[number] | null
          ) => {
            const l = left?.gold || 0;
            const r = right?.gold || 0;
            const diff = Math.round(l - r);
            const abs = Math.abs(diff);
            return (
              <div className="w-16 relative text-center flex items-center justify-center text-sm font-bold bg-black/80 border border-gray-600 h-full">
                {diff > 0 && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-blue-300">
                    <ChevronLeft />
                  </div>
                )}
                {diff < 0 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-red-300">
                    <ChevronRight />
                  </div>
                )}
                <span className="text-gray-100">{abs}</span>
              </div>
            );
          };

          return (
            <div className="flex flex-col justify-center h-full border-2 border-gray-600">
              {(() => {
                const usedOrder = new Set<string>();
                const usedChaos = new Set<string>();
                return laneOrder.map((lane) => {
                  const leftPlayer = pickByLaneWithFallback(orderPlayers, lane, usedOrder);
                  if (leftPlayer) usedOrder.add(leftPlayer.summonerName);
                  const rightPlayer = pickByLaneWithFallback(chaosPlayers, lane, usedChaos);
                  if (rightPlayer) usedChaos.add(rightPlayer.summonerName);
                  return (
                    <div key={lane} className="flex items-center h-[48px] border border-solid border-gray-600">
                      {renderPlayerSide(leftPlayer, "left")}
                      {renderGoldDiff(leftPlayer, rightPlayer)}
                      {renderPlayerSide(rightPlayer, "right")}
                    </div>
                  );
                });
              })()}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
