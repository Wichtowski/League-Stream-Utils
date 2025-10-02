import React from "react";
import Image from "next/image";
import { LiveGameData } from "@libLeagueClient/types";
import { getChampionSquareImage, getDefaultAsset, getSummonerSpellImageByName } from "@libLeagueClient/components/common";
import { getItemImage } from "@lib/items";

interface LaneHudProps {
  gameData: LiveGameData;
  gameVersion: string;
}

export const LaneHud: React.FC<LaneHudProps> = ({ gameData, gameVersion }): React.ReactElement => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gray-900/95 border-t-2 border-gray-600">
      <div className="h-full w-full px-3">
        {(() => {
          const laneOrder = ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"] as const;
          type LaneKey = typeof laneOrder[number];
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

          const scoreMatch = (p: typeof gameData.allPlayers[number], lane: LaneKey): number => {
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
          ): typeof gameData.allPlayers[number] | null => {
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

          const renderItems = (items: typeof gameData.allPlayers[number]["items"]) => {
            const six = Array.from({ length: 6 }).map((_, i) => items?.[i] || null);
            return (
              <div className="flex gap-1">
                {six.map((it, idx) => (
                  <div key={idx} className="w-5 h-5 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                    {it ? <Image src={getItemImage(it.itemID)} alt={it.name} width={20} height={20} /> : null}
                  </div>
                ))}
              </div>
            );
          };

          const renderSpells = (p: typeof gameData.allPlayers[number]) => {
            const s1 = p.summonerSpells?.summonerSpellOne?.displayName;
            const s2 = p.summonerSpells?.summonerSpellTwo?.displayName;
            return (
              <div className="flex gap-1">
                <div className="w-5 h-5 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                  {s1 ? <Image src={getSummonerSpellImageByName(s1)} alt={s1} width={20} height={20} /> : null}
                </div>
                <div className="w-5 h-5 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                  {s2 ? <Image src={getSummonerSpellImageByName(s2)} alt={s2} width={20} height={20} /> : null}
                </div>
              </div>
            );
          };

          const renderRunes = () => {
            return (
              <div className="flex gap-1">
                <div className="w-5 h-5 bg-gray-700 rounded border border-gray-600" />
                <div className="w-5 h-5 bg-gray-700 rounded border border-gray-600" />
              </div>
            );
          };

          const renderTrinket = () => {
            return <div className="w-5 h-5 bg-gray-700 rounded border border-gray-600" />;
          };

          const renderPlayerSide = (
            p: typeof gameData.allPlayers[number] | undefined | null,
            align: "left" | "right"
          ) => {
            if (!p) return <div className="flex-1" />;
            return (
              <div className={`flex items-center gap-2 ${align === "left" ? "justify-start" : "justify-end"} flex-1`}>
                {align === "left" ? (
                  <>
                    <Image
                      src={getChampionSquareImage(p.championName) || getDefaultAsset(gameVersion, "player.png")}
                      alt={p.championName}
                      width={24}
                      height={24}
                      className="rounded"
                    />
                    <div className="text-xs">
                      <div className="font-semibold truncate max-w-[120px]">{p.summonerName || p.championName}</div>
                      <div className="text-gray-300">CS {p.scores?.creepScore ?? 0}</div>
                    </div>
                    {renderSpells(p)}
                    {renderItems(p.items)}
                    {renderTrinket()}
                    {renderRunes()}
                  </>
                ) : (
                  <>
                    {renderRunes()}
                    {renderTrinket()}
                    {renderItems(p.items)}
                    {renderSpells(p)}
                    <div className="text-right text-xs">
                      <div className="font-semibold truncate max-w-[120px]">{p.summonerName || p.championName}</div>
                      <div className="text-gray-300">CS {p.scores?.creepScore ?? 0}</div>
                    </div>
                    <Image
                      src={getChampionSquareImage(p.championName) || getDefaultAsset(gameVersion, "player.png")}
                      alt={p.championName}
                      width={24}
                      height={24}
                      className="rounded"
                    />
                  </>
                )}
              </div>
            );
          };

          const ChevronLeft = (): React.ReactElement => (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
            </svg>
          );

          const ChevronRight = (): React.ReactElement => (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
            </svg>
          );

          const renderGoldDiff = (
            left?: typeof gameData.allPlayers[number] | null,
            right?: typeof gameData.allPlayers[number] | null
          ) => {
            const l = left?.gold || 0;
            const r = right?.gold || 0;
            const diff = Math.round(l - r);
            const abs = Math.abs(diff);
            return (
              <div className="w-28 relative text-center text-sm font-bold">
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
            <div className="flex flex-col justify-center h-full gap-1">
              {(() => {
                const usedOrder = new Set<string>();
                const usedChaos = new Set<string>();
                return laneOrder.map((lane) => {
                  const leftPlayer = pickByLaneWithFallback(orderPlayers, lane, usedOrder);
                  if (leftPlayer) usedOrder.add(leftPlayer.summonerName);
                  const rightPlayer = pickByLaneWithFallback(chaosPlayers, lane, usedChaos);
                  if (rightPlayer) usedChaos.add(rightPlayer.summonerName);
                return (
                  <div key={lane} className="flex items-center">
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


