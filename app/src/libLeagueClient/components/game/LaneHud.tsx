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
import { Resolutions } from "@libLeagueClient/components/game/GameDataDisplay";

interface LaneHudProps {
  gameData: LiveGameData;
  gameVersion: string;
  resolution?: Resolutions;
}

export const LaneHud: React.FC<LaneHudProps> = ({ gameData, gameVersion, resolution = "WQHD" }): React.ReactElement => {
  const [levelAnimations, setLevelAnimations] = useState<Record<string, boolean>>({});
  const [previousLevels, setPreviousLevels] = useState<Record<string, number>>({});
  const borderColor = "border-zinc-600/50";
  const bgColor = "bg-black/85";

  // Resolution-based styling adjustments
  const getResolutionStyles = (): {
    maxWidth: string;
    height: string; 
    fontSize: string; 
    spacing: string; 
    itemSize: string; 
    itemPadding: string;
    championSize: string; 
    visionScorePosition: number;
    goldDiffFontSize: string;
    goldDiffWidth: string;
    playerTextPadding: string;
    trinketSize: string;
    playerTextWidth: string;
    spellAndRuneSize: string;
  } => {
    switch (resolution) {
      case "4K":
        return {
          maxWidth: "max-w-[1280px]",
          height: "h-[80px]", // Even taller for 4K
          fontSize: "text-lg", // Larger text
          spacing: "gap-2.5", // More spacing
          itemSize: "w-10 h-10", // Even larger items
          itemPadding: "px-1 py-0.5",
          championSize: "w-16 h-16", // 64x64px champions
          visionScorePosition: 220, // Adjusted for 4K
          goldDiffFontSize: "text-xl", // Even larger gold diff text
          playerTextPadding: "py-3",
          trinketSize: "w-10.5 h-10.5",
          playerTextWidth: "w-46",
          spellAndRuneSize: "w-10 h-10",
          goldDiffWidth: "w-16",
        };
      case "WQHD":
        return {
          maxWidth: "max-w-[1200px]",
          height: "h-[70px]", // Much taller for WQHD
          fontSize: "text-base", // Larger text
          spacing: "gap-1", // More spacing
          spellAndRuneSize: "w-8.5 h-8.5",
          itemSize: "w-7.5 h-7.5", // Larger items
          itemPadding: "px-1 py-0.5",
          trinketSize: "w-8.5 h-8.5",
          championSize: "w-17 h-17", // 60x60px champions
          visionScorePosition: 200, // Adjusted for right side positioning
          goldDiffFontSize: "text-lg", // Larger gold diff text
          playerTextPadding: "py-2.5",
          playerTextWidth: "w-42",
          goldDiffWidth: "w-22",
        };
      default: // FHD
        return {
          maxWidth: "max-w-[936px]",
          height: "h-[50px]", // Current height
          fontSize: "text-xs", // Current text size
          spacing: "gap-0.5", // Current spacing
          itemSize: "w-6 h-6", // Current item size
          itemPadding: "px-0.5 py-3",
          championSize: "w-12 h-12", // Current champion size (48x48)
          visionScorePosition: 170, // Current position
          goldDiffFontSize: "text-sm", // Current gold diff text
          playerTextPadding: "py-1",
          trinketSize: "w-6 h-6",
          playerTextWidth: "w-38",
          spellAndRuneSize: "w-7.5 h-7.5",
          goldDiffWidth: "w-16",
        };
    }
  };

  const resolutionStyles = getResolutionStyles();

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
      <div>
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
          
          const itemStyle = `${resolutionStyles.itemSize} bg-zinc-900 rounded relative overflow-hidden flex items-center justify-center`;

          const renderItems = (items: (typeof gameData.allPlayers)[number]["items"], trinketItemID: number, visionScore: number, align: "left" | "right", isDead: boolean = false) => {
            // Create array of 7 slots (0-6) with proper typing
            const slots: (typeof items[0] | null)[] = Array.from({ length: 7 }).map(() => null);
            
            // Trinket items that should always be in slot 6 (last position)
            const gameTrinkets = [3363, 3364, 3340]; // Farsight Alteration, Oracle Lens, Stealth Ward
            
            // First, try to fill slots based on slot property
            items?.forEach(item => {
              if (item && typeof item.slot === 'number' && item.slot >= 0 && item.slot < 7) {
                // If it's a trinket item, only put it in slot 6, skip if in other slots
                if (gameTrinkets.includes(item.itemID)) {
                  if (item.slot === 6) {
                    slots[6] = item;
                  }
                  // Skip trinkets in slots 0-5
                } else {
                  // For non-trinket items, use their original slot
                  slots[item.slot] = item;
                }
              }
            });
            
            // If no items were placed using slot property, fall back to array index
            if (slots.every(slot => slot === null)) {
              items?.forEach((item, index) => {
                if (item && index < 6 && !gameTrinkets.includes(item.itemID)) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (slots as any)[index] = item;
                }
              });
            }
            
            // Handle trinket in slot 6
            const trinketItem = items?.find(item => gameTrinkets.includes(item.itemID));
            if (trinketItem) {
              slots[6] = trinketItem;
            } else if (trinketItemID) {
              slots[6] = { itemID: trinketItemID, name: "Trinket", count: 1, price: 0, slot: 6 };
            }
            
            const fixedWardScore = parseInt(visionScore.toFixed(0)) || 0;
            const trinketCenterLeftPx = align === "right" ? resolutionStyles.visionScorePosition : 14;
            
            // For WQHD and 4K, use 2-row layout
            if (resolution === "WQHD" || resolution === "4K") {
              // Split items: first 3 items in top row, last 3 items in bottom row, trinket on the right side
              const topRowItems = slots.slice(0, 3);
              const bottomRowItems = slots.slice(3, 6);
              const trinketItem = slots[6];
              
              return (
                <div className="relative">
                  <div className={`flex ${align === "left" ? "flex-row-reverse" : "flex-row"} ${resolutionStyles.itemPadding} ${resolutionStyles.spacing} h-full bg-black/85`}>
                    {/* Left side - 2 rows of items */}
                    <div className="flex flex-col flex-1">
                       {/* Top row - first 3 items */}
                       <div className={`flex ${resolutionStyles.spacing} mb-1`}>
                         {align === "left"
                           ? topRowItems.reverse().map((it, idx) => (
                               <div key={idx} className={itemStyle}>
                                 {it ? (
                                   <Image src={getItemImage(it.itemID)} alt={it.name} fill sizes="32px" className={`object-cover ${isDead ? "grayscale brightness-50" : ""}`} />
                                 ) : null}
                               </div>
                             ))
                           : topRowItems.map((it, idx) => (
                               <div key={idx} className={itemStyle}>
                                 {it ? (
                                   <Image src={getItemImage(it.itemID)} alt={it.name} fill sizes="32px" className={`object-cover ${isDead ? "grayscale brightness-50" : ""}`} />
                                 ) : null}
                               </div>
                             ))}
                       </div>
                      
                      {/* Bottom row - last 3 items */}
                      <div className={`flex ${resolutionStyles.spacing}`}>
                        {align === "left"
                          ? bottomRowItems.reverse().map((it, idx) => (
                              <div key={idx + 3} className={itemStyle}>
                                {it ? (
                                  <Image src={getItemImage(it.itemID)} alt={it.name} fill sizes="32px" className={`object-cover ${isDead ? "grayscale brightness-50" : ""}`} />
                                ) : null}
                              </div>
                            ))
                          : bottomRowItems.map((it, idx) => (
                              <div key={idx + 3} className={itemStyle}>
                                {it ? (
                                  <Image src={getItemImage(it.itemID)} alt={it.name} fill sizes="32px" className={`object-cover ${isDead ? "grayscale brightness-50" : ""}`} />
                                ) : null}
                              </div>
                            ))}
                      </div>
                    </div>
                    
                     {/* Center - trinket with vision score on top */}
                     <div className="flex items-center justify-center relative">
                       <div className="flex flex-col items-center">
                         <div className={`text-white ${resolutionStyles.fontSize} mt-[-6px] font-bold rounded min-w-[16px] text-center mb-1 z-30 bg-transpa `}>
                           {fixedWardScore}
                         </div>
                           <div className={`${itemStyle} ${resolutionStyles.trinketSize} mt-[-12px] `}>
                            {gameTrinkets.includes(trinketItem?.itemID || 0) && trinketItem ? (
                              <Image src={getItemImage(trinketItem.itemID)} alt={trinketItem.name} fill sizes="32px" className={`object-cover ${isDead ? "grayscale brightness-50" : ""}`} />
                            ) : null}
                         </div>
                       </div>
                     </div>
                  </div>
                </div>
              );
            }
            return (
              <div className="relative">
                <div className={`flex ${resolutionStyles.itemPadding} ${resolutionStyles.spacing} h-full bg-black/85`}>
                   {align === "left"
                     ? slots.reverse().map((it, idx) => (
                         <div
                           key={idx}
                           className={itemStyle}
                         >
                           {it ? (
                             <Image src={getItemImage(it.itemID)} alt={it.name} fill sizes="32px" className={`object-cover ${isDead ? "grayscale brightness-50" : ""}`} />
                           ) : null}
                         </div>
                       ))
                     : slots.map((it, idx) => (
                         <div
                           key={idx}
                           className={itemStyle}
                         >
                           {it ? (
                             <Image src={getItemImage(it.itemID)} alt={it.name} fill sizes="32px" className={`object-cover ${isDead ? "grayscale brightness-50" : ""}`} />
                           ) : null}
                         </div>
                       ))}
                </div>
                <div className={`absolute -top-0.5 z-30 pointer-events-none text-white ${resolutionStyles.fontSize} font-bold px-2 rounded min-w-[16px] text-center -translate-x-1/2`} style={{ left: `${trinketCenterLeftPx}px` }}>
                  {fixedWardScore}
                </div>
              </div>
            );
          };

          const runeAndSpellStyle = `${resolutionStyles.spellAndRuneSize} flex items-center justify-center`;
          
          const renderSpells = (spell: (typeof gameData.allPlayers)[number]["summonerSpells"], isDead: boolean = false, flexDir: "row" | "col" = "col") => {
            const s1 = spell?.summonerSpellOne?.displayName;
            const s2 = spell?.summonerSpellTwo?.displayName;
            return (
              <div className={`flex ${flexDir === "row" ? "flex-row" : "flex-col"}`}>
                <div className={`${runeAndSpellStyle} ${bgColor}`}>
                  {s1 ? <Image src={getSummonerSpellImageByName(s1)} alt={s1} width={32} height={32} className={isDead ? "grayscale brightness-50" : ""} /> : null}
                </div>
                <div className={`${runeAndSpellStyle} ${bgColor}`}>
                  {s2 ? <Image src={getSummonerSpellImageByName(s2)} alt={s2} width={32} height={32} className={isDead ? "grayscale brightness-50" : ""} /> : null}
                </div>
              </div>
            );
          };

          const isSmallerRune = (rune: string) => {
            return rune.includes("7202_sorcery.png") ;
          };

          const renderRunes = (runes: (typeof gameData.allPlayers)[number]["runes"], isDead: boolean = false, flexDir: "row" | "col" = "col") => {
            const r1 = runes?.keystone;
            const r2 = runes?.secondaryRuneTree;
            const rune1Image = getRuneImage(r1);
            const rune2Image = getRuneImage(r2);
            return (
              <div className={`flex ${flexDir === "row" ? "flex-row" : "flex-col"}`}>
                <div className={`${runeAndSpellStyle} bg-zinc-900`}>
                  {rune1Image ? <Image src={rune1Image} alt={r1} width={28} height={28} className={isDead ? "grayscale brightness-50" : ""} /> : null}
                </div>
                <div className={`${runeAndSpellStyle} bg-zinc-900 ${isSmallerRune(rune2Image) ? "p-0.75" : "p-1.25"}`}>
                  {rune2Image ? <Image src={rune2Image} alt={r2} width={24} height={24} className={isDead ? "grayscale brightness-50" : ""} /> : null}
                </div>
              </div>
            );
          };


          const renderChampImage = (summonerName: string, championName: string, level: number, isDead: boolean, respawnTimer: number, align: "left" | "right") => {
            const showLevelAnimation = levelAnimations[summonerName] || false;
            const alignmentClass = align === "left" ? "justify-end" : "justify-start";
            return (
              <div className={`relative flex ${alignmentClass}`}>
                <div className={`relative ${resolutionStyles.championSize}`}>
                  <Image
                    src={getChampionSquareImage(championName) || getDefaultAsset(gameVersion, "player.png")}
                    alt={championName}
                    fill
                    sizes="60px"
                    className={`${isDead ? "grayscale brightness-50" : ""} ${showLevelAnimation ? "opacity-0" : "opacity-100 transition-opacity duration-300"} object-cover`}
                  />
                  {showLevelAnimation ? (
                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                      <div className="text-white text-3xl font-bold animate-pulse">
                        {level || 1}
                      </div>
                    </div>
                  ) : (
                    <div className={`absolute bottom-0 ${align === "left" ? "left-[-6px]" : "right-[-6px]"} bg-black/60 text-white text-sm font-bold px-1 ${align === "left" ? "rounded-br" : "rounded-bl"} shadow-lg`}>
                      {level || 1}
                      <div className={`absolute ${align === "left" ? "left-0 top-0" : "right-0 top-0"} w-0 h-0 ${align === "left" ? "border-l-0 border-r-4 border-b-4 border-t-0 border-l-transparent border-r-black/80 border-b-black/80 border-t-transparent" : "border-l-4 border-r-0 border-b-4 border-t-0 border-l-black/80 border-r-transparent border-b-black/80 border-t-transparent"}`}></div>
                    </div>
                  )}
                  {isDead && respawnTimer > 0 ? (
                     <div className="absolute inset-0 flex items-center justify-center">
                       <div className="text-white text-3xl font-extrabold leading-none text-center" style={{ 
                         textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000'
                       }}>
                      {Math.ceil(respawnTimer)}
                       </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          };

          const renderResource = (resourceType?: string, resourceValue?: number, resourceMax?: number) => {
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
                <div 
                  className={`h-full ${gradientClass} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
            );
          };

          const renderTexts = (playerScore: (typeof gameData.allPlayers)[number]["scores"], summonerName: string, currentHealth: number, maxHealth: number, align: "left" | "right", resourceType?: string, resourceValue?: number, resourceMax?: number) => {
            const healthPercentage = (currentHealth / maxHealth) * 100;
            
            return (
                <div className={`flex direction-${align} justify-between flex-row${align === "left" ? "-reverse" : ""} ${bgColor} ${resolutionStyles.playerTextWidth} h-full ${resolutionStyles.playerTextPadding}`}>
                <div className={`flex flex-col items-end min-w-10 min-h-10 ${align === "left" ? "pr-0.5 items-end" : "pl-0.5 items-start"} h-full`}>
                  <div className={`text-orange-200 font-bold ${resolutionStyles.fontSize}`}>{playerScore.creepScore ?? 0}</div>
                  <div className={`text-white font-bold ${resolutionStyles.fontSize}`}>{playerScore.kills}/{playerScore.deaths}/{playerScore.assists}</div>
                </div>
                <div className={`${resolutionStyles.fontSize} flex-shrink-0 h-full flex flex-col justify-between px-1`}>
                  <div className={`font-semibold truncate max-w-[100px] ${align === "left" ? "text-left" : "text-right"}`}>{summonerName}</div>
                  <div className="w-full">
                    {healthPercentage > 0 && (
                    <div className={`w-20 h-2 bg-green-900 mb-0.5 ${align === "right" ? "transform scale-x-[-1]" : ""}`}>
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                        style={{ width: `${healthPercentage}%` }}
                      />
                    </div>
                    )}
                    {!resourceType || !resourceValue || !resourceMax ? null : (
                    <div className={`w-20 h-2 bg-gray-700 ${align === "right" ? "transform scale-x-[-1]" : ""}`}>
                      {renderResource(resourceType, resourceValue, resourceMax)}
                    </div>
                    )}
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
              <div className={`flex items-center ${borderColor} ${align === "left" ? "justify-end border-r-2" : "justify-start border-l-2"} flex-1`}>
                {resolution === "4K" && (
                  <>
                    {align === "left" ? (
                      <>
                        {renderItems(p.items, p.items?.[0]?.itemID || 0, p.scores.wardScore, "left", p.isDead)}
                        {renderRunes(p.runes, p.isDead)}
                        {renderTexts(p.scores, p.riotIdGameName, p.currentHealth, p.maxHealth, "left", p.resourceType, p.resourceValue, p.resourceMax)}
                        {renderSpells(p.summonerSpells, p.isDead)}
                        {renderChampImage(p.summonerName, p.championName, p.level, p.isDead, p.respawnTimer, "left")}
                      </>
                    ) : (
                      <>
                        {renderChampImage(p.summonerName, p.championName, p.level, p.isDead, p.respawnTimer, "right")}
                        {renderSpells(p.summonerSpells, p.isDead)}
                        {renderTexts(p.scores, p.riotIdGameName, p.currentHealth, p.maxHealth, "right", p.resourceType, p.resourceValue, p.resourceMax)}
                        {renderRunes(p.runes, p.isDead)}
                        {renderItems(p.items, p.items?.[0]?.itemID || 0, p.scores.wardScore, "right", p.isDead)}
                      </>
                    )}
                  </>
                )}
                {resolution === "WQHD" && (
                  <>
                    {align === "left" ? (
                      <>
                        {renderItems(p.items, p.items?.[0]?.itemID || 0, p.scores.wardScore, "left", p.isDead)}
                        {renderTexts(p.scores, p.riotIdGameName, p.currentHealth, p.maxHealth, "left", p.resourceType, p.resourceValue, p.resourceMax)}
                        <div className="flex flex-col">
                          {renderSpells(p.summonerSpells, p.isDead, "row")}
                          {renderRunes(p.runes, p.isDead, "row")}
                        </div>
                        {renderChampImage(p.summonerName, p.championName, p.level, p.isDead, p.respawnTimer, "left")}
                      </>
                    ) : (
                      <>
                        {renderChampImage(p.summonerName, p.championName, p.level, p.isDead, p.respawnTimer, "right")}
                        <div className="flex flex-col">
                          {renderSpells(p.summonerSpells, p.isDead, "row")}
                          {renderRunes(p.runes, p.isDead, "row")}
                        </div>
                        {renderTexts(p.scores, p.riotIdGameName, p.currentHealth, p.maxHealth, "right", p.resourceType, p.resourceValue, p.resourceMax)}
                        {renderItems(p.items, p.items?.[0]?.itemID || 0, p.scores.wardScore, "right", p.isDead)}
                      </>
                    )}
                  </>
                )} 
                {resolution === "FHD" && (
                  <>
                    {align === "left" ? (
                      <>
                        {renderItems(p.items, p.items?.[0]?.itemID || 0, p.scores.wardScore, "left", p.isDead)}
                        {renderRunes(p.runes, p.isDead)}
                        {renderTexts(p.scores, p.riotIdGameName, p.currentHealth, p.maxHealth, "left", p.resourceType, p.resourceValue, p.resourceMax)}
                        {renderSpells(p.summonerSpells, p.isDead)}
                        {renderChampImage(p.summonerName, p.championName, p.level, p.isDead, p.respawnTimer, "left")}
                      </>
                    ) : (
                      <>
                        {renderChampImage(p.summonerName, p.championName, p.level, p.isDead, p.respawnTimer, "right")}
                        {renderSpells(p.summonerSpells, p.isDead)}
                        {renderTexts(p.scores, p.riotIdGameName, p.currentHealth, p.maxHealth, "right", p.resourceType, p.resourceValue, p.resourceMax)}
                        {renderRunes(p.runes, p.isDead)}
                        {renderItems(p.items, p.items?.[0]?.itemID || 0, p.scores.wardScore, "right", p.isDead)}
                      </>
                    )}
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
              <div className={`${resolutionStyles.goldDiffWidth} h-full relative text-center flex items-center justify-center ${resolutionStyles.goldDiffFontSize} font-bold ${bgColor}`}>
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
                    <div key={lane} className={`flex items-center ${resolutionStyles.height} border-x-2 border-y-2 border-b-0 ${borderColor} ${lane === "TOP" ? "border-t-2" : ""}`}>
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
  );
};
