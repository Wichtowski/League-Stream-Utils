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
  const borderColor = "border-zinc-600/50";
  const bgColor = "bg-black/78";

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
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
      <div className="px-3">
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
          
          const itemStyle = "w-5 h-5 bg-zinc-900 rounded flex items-center justify-center";

          const renderItems = (items: (typeof gameData.allPlayers)[number]["items"], align: "left" | "right") => {
            const six = Array.from({ length: 6 }).map((_, i) => items?.[i] || null);
            return (
              <div className={`flex gap-1 h-full ${bgColor}`}>
                {align === "left"
                  ? six.reverse().map((it, idx) => (
                      <div
                        key={idx}
                        className={itemStyle}
                      >
                        {it ? <Image src={getItemImage(it.itemID)} alt={it.name} width={20} height={20} /> : null}
                      </div>
                    ))
                  : six.map((it, idx) => (
                      <div
                        key={idx}
                        className={itemStyle}
                      >
                        {it ? <Image src={getItemImage(it.itemID)} alt={it.name} width={20} height={20} /> : null}
                      </div>
                    ))}
              </div>
            );
          };
          const runeAndSpellStyle = "w-6 h-6 border border-black flex items-center justify-center";
          
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
                <div className={`${runeAndSpellStyle} bg-zinc-900`}>
                  {r1 ? <Image src={getRuneImage(r1)} alt={r1} width={22} height={22} /> : null}
                </div>
                <div className={`${runeAndSpellStyle} bg-zinc-900`}>
                  {r2 ? <Image src={getRuneImage(r2)} alt={r2} width={18} height={18} /> : null}
                </div>
              </div>
            );
          };

          const renderTrinket = (_trinketType: number, _wardScore: number) => {
            return <div className={runeAndSpellStyle} />;
          };

          const renderImage = (summonerName: string, championName: string, level: number, isDead: boolean, respawnTimer: number, align: "left" | "right") => {
            const showLevelAnimation = levelAnimations[summonerName] || false;
            const alignmentClass = align === "left" ? "justify-end" : "justify-start";
            
            return (
              <div className={`relative rounded flex ${alignmentClass}`}>
                <Image
                  src={getChampionSquareImage(championName) || getDefaultAsset(gameVersion, "player.png")}
                  alt={championName}
                  width={48}
                  height={48}
                  className={showLevelAnimation ? "opacity-0" : `${isDead ? "grayscale brightness-50" : ""} opacity-100 transition-opacity duration-300`}
                />
                {showLevelAnimation ? (
                  <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <div className="text-white text-3xl font-bold animate-pulse">
                      {level || 1}
                    </div>
                  </div>
                ) : (
                  <div className={`absolute bottom-0 ${align === "left" ? "left-[-6px]" : "right-[-6px]"} bg-black/80 text-white text-sm font-bold px-1 ${align === "left" ? "rounded-br" : "rounded-bl"} shadow-lg`}>
                    {level || 1}
                    <div className={`absolute ${align === "left" ? "left-0 top-0" : "right-0 top-0"} w-0 h-0 ${align === "left" ? "border-l-0 border-r-4 border-b-4 border-t-0 border-l-transparent border-r-black/80 border-b-black/80 border-t-transparent" : "border-l-4 border-r-0 border-b-4 border-t-0 border-l-black/80 border-r-transparent border-b-black/80 border-t-transparent"}`}></div>
                  </div>
                )}
                {isDead && respawnTimer > 0 ? (
                  <div className={`absolute top-1/2 -translate-y-1/2 ${align === "left" ? "left-[-14px]" : "right-[-14px]"} bg-black/90 text-white text-2xl font-extrabold leading-none px-2 py-1 rounded ${align === "left" ? "rounded-tr rounded-br" : "rounded-tl rounded-bl"} shadow-lg`}> 
                    {Math.ceil(respawnTimer)}
                  </div>
                ) : null}
              </div>
            );
          };

          const renderResource = (align: "left" | "right", resourceType?: string, resourceValue?: number, resourceMax?: number) => {
            if (!resourceType || resourceType === "none" || !resourceValue || !resourceMax) return null;
            
            const percentage = (resourceValue / resourceMax) * 100;
            let barColor = "bg-blue-500";
            
            switch (resourceType) {
              case "mana":
                barColor = "bg-blue-500";
                break;
              case "energy":
                barColor = "bg-yellow-500";
                break;
              case "fury":
              case "battlefury":
              case "dragonfury":
              case "rage":
              case "gnarfury":
                barColor = "bg-red-500";
                break;
              case "heat":
                barColor = "bg-orange-500";
                break;
              case "ferocity":
                barColor = "bg-purple-500";
                break;
              case "bloodwell":
                barColor = "bg-red-600";
                break;
              case "wind":
                barColor = "bg-cyan-400";
                break;
              case "moonlight":
                barColor = "bg-indigo-400";
                break;
              default:
                barColor = "bg-gray-500";
            }
            
            const isMana = resourceType === "mana";
            const gradientClass = isMana ? "bg-gradient-to-r from-blue-400 to-blue-600" : barColor;
            
            return (
              <div className={`w-24 h-2 bg-gray-700 ${align === "right" ? "transform scale-x-[-1]" : ""}`}>
                <div 
                  className={`h-full ${gradientClass} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            );
          };

          const renderTexts = (playerScore: (typeof gameData.allPlayers)[number]["scores"], summonerName: string, currentHealth: number, maxHealth: number, align: "left" | "right", resourceType?: string, resourceValue?: number, resourceMax?: number) => {
            const healthPercentage = (currentHealth / maxHealth) * 100;
            
            return (
              <div className={`flex direction-${align} justify-between flex-row${align === "left" ? "-reverse" : ""} ${bgColor} w-38 h-full py-1`}>
                <div className={`flex flex-col items-end ${align === "left" ? "items-start" : "items-end"} h-full`}>
                  <div className="text-orange-200 font-bold text-sm">{playerScore.creepScore ?? 0}</div>
                  <div className="text-white font-bold text-sm">{playerScore.kills}/{playerScore.deaths}/{playerScore.assists}</div>
                </div>
                <div className="text-xs flex-shrink-0 h-full flex flex-col justify-between">
                  <div className="font-semibold truncate max-w-[80px]">{summonerName}</div>
                  <div className="w-full">
                    <div className={`w-24 h-2 bg-green-900 mb-0.5 ${align === "right" ? "transform scale-x-[-1]" : ""}`}>
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                        style={{ width: `${healthPercentage}%` }}
                      />
                    </div>
                    {renderResource(align, resourceType, resourceValue, resourceMax)}
                  </div>
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
              <div className={`flex items-center border-solid ${borderColor} ${align === "left" ? "justify-end border-r-2" : "justify-start border-l-2"} flex-1`}>
                {align === "left" ? (
                  <>
                    {renderTrinket(p.items[0].itemID, p.scores.wardScore)}
                    {renderItems(p.items, "left")}
                    {renderRunes(p.runes)}
                    {renderTexts(p.scores, p.summonerName, p.currentHealth, p.maxHealth, "left", p.resourceType, p.resourceValue, p.resourceMax)}
                    {renderSpells(p.summonerSpells)}
                    {renderImage(p.summonerName, p.championName, p.level, p.isDead, p.respawnTimer, "left")}
                  </>
                ) : (
                  <>
                    {renderImage(p.summonerName, p.championName, p.level, p.isDead, p.respawnTimer, "right")}
                    {renderSpells(p.summonerSpells)}
                    {renderTexts(p.scores, p.summonerName, p.currentHealth, p.maxHealth, "right", p.resourceType, p.resourceValue, p.resourceMax)}
                    {renderRunes(p.runes)}
                    {renderItems(p.items, "right")}
                    {renderTrinket(p.items[0].itemID, p.scores.wardScore)}
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
              <div className={`w-16 h-full relative text-center flex items-center justify-center text-sm font-bold ${bgColor}`}>
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
            <div className="flex flex-col">
              {(() => {
                const usedOrder = new Set<string>();
                const usedChaos = new Set<string>();
                return laneOrder.map((lane) => {
                  const leftPlayer = pickByLaneWithFallback(orderPlayers, lane, usedOrder);
                  if (leftPlayer) usedOrder.add(leftPlayer.summonerName);
                  const rightPlayer = pickByLaneWithFallback(chaosPlayers, lane, usedChaos);
                  if (rightPlayer) usedChaos.add(rightPlayer.summonerName);
                  return (
                    <div key={lane} className={`flex items-center h-[50px] border-x-2 border-y-1 border-b-0 border-solid ${borderColor} ${lane === "TOP" ? "border-t-2" : ""}`}>
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
