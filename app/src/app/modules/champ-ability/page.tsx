"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import type { Champion } from "@lib/types/game";
import Image from "next/image";
import { DDRAGON_CDN } from "@lib/services/common/constants";
import { getChampions, getChampionCacheStats } from "@lib/champions";
import { DownloadProgress } from "@lib/services/assets/downloader";
import { assetCache } from "@lib/services/assets/assetCache";
import { DownloadProgressModal } from "@lib/components/common/modal";
import { PageWrapper } from "@lib/layout/PageWrapper";

type Spell = {
  id: string;
  name: string;
  image: { full: string };
};

type Passive = {
  name: string;
  image: { full: string };
};

type ChampionDetail = Champion & {
  passive: Passive;
  spells: Spell[];
};

interface CacheStats {
  totalChampions: number;
  cacheSize: number;
  version: string;
}

const VERSION = "15.17.1";

const languages = [
  { code: "en_US", name: "English" },
  { code: "pl_PL", name: "Polski" },
  { code: "de_DE", name: "Deutsch" },
  { code: "es_ES", name: "Español" },
  { code: "fr_FR", name: "Français" },
  { code: "it_IT", name: "Italiano" },
  { code: "pt_BR", name: "Português" },
  { code: "ru_RU", name: "Русский" },
  { code: "ko_KR", name: "한국어" },
  { code: "ja_JP", name: "日本語" }
];

const ICON_URL = (champ: string) => `${DDRAGON_CDN}/${VERSION}/img/champion/${champ}.png`;
const CHAMP_DETAIL_URL = (champ: string, lang: string) =>
  `${DDRAGON_CDN}/${VERSION}/data/${lang}/champion/${champ}.json`;
const SPELL_ICON_URL = (img: string) => `${DDRAGON_CDN}/${VERSION}/img/spell/${img}`;

export default function ChampAbilityPage() {
  const { setActiveModule } = useNavigation();
  const [_champions, setChampions] = useState<Champion[]>([]);
  const [filteredChampions, setFilteredChampions] = useState<Champion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<Champion | null>(null);
  const [champDetail, setChampDetail] = useState<ChampionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isElectron, setIsElectron] = useState(false);
  const [redTeam, setRedTeam] = useState<Champion[]>([]);
  const [blueTeam, setBlueTeam] = useState<Champion[]>([]);
  const [draggedChamp, setDraggedChamp] = useState<Champion | null>(null);
  const [dragOverRed, setDragOverRed] = useState(false);
  const [dragOverBlue, setDragOverBlue] = useState(false);
  const [showOnlyR, setShowOnlyR] = useState(false);
  const [language, setLanguage] = useState("pl_PL");
  const [_cacheStats, _setCacheStats] = useState<CacheStats | null>(null);

  // Download progress state
  const [downloadProgress, _setDownloadProgress] = useState<DownloadProgress>({
    stage: "checking",
    current: 0,
    total: 0,
    message: "",
    errors: [],
    activeConnections: 0,
    queueLength: 0
  });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadChampions = useCallback(async () => {
    setLoading(true);
    try {
      const champs = await getChampions();
      setChampions(champs);
      setFilteredChampions(champs);
    } catch (error) {
      console.error("Failed to load champions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCacheStats = useCallback(async () => {
    if (!isElectron) return;

    try {
      const stats = await getChampionCacheStats();
      _setCacheStats(stats);
    } catch (error) {
      console.warn("Failed to load cache stats:", error);
    }
  }, [isElectron]);

  useEffect(() => {
    setActiveModule("champ-ability");
    setIsElectron(typeof window !== "undefined" && !!window.electronAPI?.isElectron);
    loadChampions();
    loadCacheStats();
  }, [setActiveModule, isElectron, setIsElectron, loadChampions, loadCacheStats]);

  const handleCancelDownload = useCallback(() => {
    setShowProgressModal(false);
    setIsDownloading(false);
  }, [setShowProgressModal, setIsDownloading]);

  const getChampionIconUrl = useCallback(
    async (championKey: string): Promise<string> => {
      if (isElectron) {
        try {
          const cachedUrl = await assetCache.getChampionIcon(championKey, VERSION);
          return cachedUrl || ICON_URL(championKey);
        } catch (error) {
          console.warn(`Failed to get cached icon for ${championKey}:`, error);
          return ICON_URL(championKey);
        }
      }
      return ICON_URL(championKey);
    },
    [isElectron]
  );

  const getAbilityIconUrl = useCallback(
    async (abilityImage: string): Promise<string> => {
      if (isElectron) {
        try {
          const cachedUrl = await assetCache.getAbilityIcon(abilityImage, VERSION);
          return cachedUrl || SPELL_ICON_URL(abilityImage);
        } catch (error) {
          console.warn(`Failed to get cached ability icon for ${abilityImage}:`, error);
          return SPELL_ICON_URL(abilityImage);
        }
      }
      return SPELL_ICON_URL(abilityImage);
    },
    [isElectron]
  );

  useEffect(() => {
    if (!selected) return;
    setDetailLoading(true);
    fetch(CHAMP_DETAIL_URL(selected.key, language))
      .then((res) => res.json())
      .then((data) => {
        setChampDetail(data.data[selected.key]);
        setDetailLoading(false);
      });
  }, [selected, language]);

  if (loading)
    return (
      <PageWrapper requireAuth={false}>
        <div className="flex justify-center items-center h-screen">Loading...</div>
      </PageWrapper>
    );

  return (
    <PageWrapper
      requireAuth={false}
      title="League of Legends Champion Spell Showcase"
      breadcrumbs={[{ label: "Champion Abilities", href: "/modules/champ-ability" }]}
      contentClassName="flex flex-col items-center"
    >
      <div className="w-full max-w-7xl p-4 flex flex-col items-center">
        <div className="flex justify-center mb-6 w-full gap-4">
          <input
            type="text"
            placeholder="Search champion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
          />

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center mb-4 w-full mb-4 mt-2 mx-2">
          <button
            className="px-4 py-2 rounded bg-gray-700 text-white font-semibold hover:bg-gray-600 transition mr-2"
            onClick={() => setShowOnlyR((v) => !v)}
          >
            {showOnlyR ? "Show All Abilities" : "Show Only R"}
          </button>
        </div>
        <div
          className={`flex flex-row justify-center gap-8 w-full ${showOnlyR ? "max-w-4xl" : "max-w-6xl"} mb-8 mx-auto`}
        >
          <div
            className={`${showOnlyR ? "w-[450px]" : "w-[700px]"} rounded-lg p-6 min-h-[140px] flex flex-col items-center transition-all duration-300 bg-red-900 bg-opacity-90 border-2 border-red-700 ${dragOverRed ? "ring-4 ring-red-400 bg-opacity-100" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverRed(true);
            }}
            onDragLeave={() => setDragOverRed(false)}
            onDrop={() => {
              setDragOverRed(false);
              if (
                draggedChamp &&
                !redTeam.some((c) => c.key === draggedChamp.key) &&
                !blueTeam.some((c) => c.key === draggedChamp.key)
              ) {
                setRedTeam([...redTeam, draggedChamp]);
              }
              setDraggedChamp(null);
            }}
          >
            <div className="font-bold text-xl mb-3 text-red-300">Red Team</div>
            <div className="flex flex-col gap-4 w-full">
              {redTeam.map((champ) => (
                <div
                  key={champ.key}
                  className="flex flex-row items-center gap-6 bg-red-950 bg-opacity-60 rounded p-4 w-full justify-start"
                  onDoubleClick={() => setRedTeam(redTeam.filter((c) => c.key !== champ.key))}
                >
                  <div className="flex flex-col items-center min-w-[100px]">
                    <Image src={ICON_URL(champ.key)} alt={champ.name} width={80} height={80} className="rounded" />
                    <span className="text-sm text-center font-medium">{champ.name}</span>
                  </div>
                  <TeamChampionAbilities champId={champ.key} showOnlyR={showOnlyR} language={language} />
                </div>
              ))}
            </div>
          </div>
          <div
            className={`${showOnlyR ? "w-[450px]" : "w-[700px]"} rounded-lg p-6 min-h-[140px] flex flex-col items-center transition-all duration-300 bg-blue-900 bg-opacity-90 border-2 border-blue-700 ${dragOverBlue ? "ring-4 ring-blue-400 bg-opacity-100" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverBlue(true);
            }}
            onDragLeave={() => setDragOverBlue(false)}
            onDrop={() => {
              setDragOverBlue(false);
              if (
                draggedChamp &&
                !blueTeam.some((c) => c.key === draggedChamp.key) &&
                !redTeam.some((c) => c.key === draggedChamp.key)
              ) {
                setBlueTeam([...blueTeam, draggedChamp]);
              }
              setDraggedChamp(null);
            }}
          >
            <div className="font-bold text-xl mb-3 text-blue-300">Blue Team</div>
            <div className="flex flex-col gap-4 w-full">
              {blueTeam.map((champ) => (
                <div
                  key={champ.key}
                  className="flex flex-row items-center gap-6 bg-blue-950 bg-opacity-60 rounded p-4 w-full justify-start"
                  onDoubleClick={() => setBlueTeam(blueTeam.filter((c) => c.key !== champ.key))}
                >
                  <div className="flex flex-col items-center min-w-[100px]">
                    <Image src={ICON_URL(champ.key)} alt={champ.name} width={80} height={80} className="rounded" />
                    <span className="text-sm text-center font-medium">{champ.name}</span>
                  </div>
                  <TeamChampionAbilities champId={champ.key} showOnlyR={showOnlyR} language={language} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
          onWheel={(e) => {
            if (draggedChamp) {
              // Scroll the grid container during drag
              e.currentTarget.scrollTop += e.deltaY;
            }
          }}
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
          {filteredChampions.map((champion) => (
            <div
              key={champion.key}
              className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => setSelected(champion)}
              draggable
              onDragStart={() => setDraggedChamp(champion)}
              onDragEnd={() => setDraggedChamp(null)}
            >
              <div className="relative">
                <Image
                  width={100}
                  height={100}
                  src={ICON_URL(champion.key)}
                  alt={champion.name}
                  className="w-full h-auto rounded"
                  onError={(e) => {
                    if (isElectron) {
                      getChampionIconUrl(champion.key).then((url) => {
                        if (url !== ICON_URL(champion.key)) {
                          e.currentTarget.src = url;
                        }
                      });
                    }
                  }}
                />
              </div>
              <p className="text-center mt-2 text-sm font-medium">{champion.name}</p>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div className=" rounded-lg p-6 max-w-lg w-full relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-white hover:text-gray-300" onClick={() => setSelected(null)}>
              ✕
            </button>
            <div className="flex items-center mb-4">
              <Image
                src={ICON_URL(selected.key)}
                alt={selected.name}
                width={80}
                height={80}
                className="mr-4 rounded"
                onError={(e) => {
                  if (isElectron) {
                    getChampionIconUrl(selected.key).then((url) => {
                      if (url !== ICON_URL(selected.key)) {
                        e.currentTarget.src = url;
                      }
                    });
                  }
                }}
              />
              <div>
                <h2 className="text-2xl font-bold">{selected.name}</h2>
              </div>
            </div>

            {detailLoading ? (
              <p>Loading abilities...</p>
            ) : champDetail ? (
              <div>
                <div className="grid grid-cols-4 gap-4">
                  {champDetail.spells.map((spell: Spell, index: number) => (
                    <div key={spell.id} className="text-center">
                      <h4 className="text-sm font-medium mb-2">{["Q", "W", "E", "R"][index]}</h4>
                      <Image
                        src={SPELL_ICON_URL(spell.image.full)}
                        alt={spell.name}
                        width={50}
                        height={50}
                        className="mx-auto mb-2"
                        onError={(e) => {
                          if (isElectron) {
                            getAbilityIconUrl(spell.image.full).then((url) => {
                              if (url !== SPELL_ICON_URL(spell.image.full)) {
                                e.currentTarget.src = url;
                              }
                            });
                          }
                        }}
                      />
                      <p className="text-xs">{spell.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showProgressModal && (
        <DownloadProgressModal isOpen={showProgressModal} progress={downloadProgress} onCancel={handleCancelDownload} />
      )}

      {/* UI Lock overlay during download */}
      {isDownloading && <div className="fixed inset-0 bg-black bg-opacity-30 z-40 pointer-events-none" />}
    </PageWrapper>
  );
}

const TeamChampionAbilities = memo(
  ({ champId, showOnlyR = false, language }: { champId: string; showOnlyR?: boolean; language: string }) => {
    const [abilities, setAbilities] = useState<{
      passive: Passive;
      spells: Spell[];
    } | null>(null);
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
      setIsElectron(typeof window !== "undefined" && !!window.electronAPI?.isElectron);
      fetch(CHAMP_DETAIL_URL(champId, language))
        .then((res) => res.json())
        .then((data) => {
          const champData = data.data[champId];
          setAbilities({
            passive: champData.passive,
            spells: champData.spells
          });
        });
    }, [champId, language]);

    const getAbilityIconUrl = async (abilityImage: string): Promise<string> => {
      if (isElectron) {
        try {
          const cachedUrl = await assetCache.getAbilityIcon(abilityImage, VERSION);
          return cachedUrl || SPELL_ICON_URL(abilityImage);
        } catch (error) {
          console.warn(`Failed to get cached ability icon for ${abilityImage}:`, error);
          return SPELL_ICON_URL(abilityImage);
        }
      }
      return SPELL_ICON_URL(abilityImage);
    };

    if (!abilities) return <div className="text-xs">Loading...</div>;

    return (
      <div className="flex gap-4 items-center">
        {abilities.spells.map((spell, index) => {
          if (showOnlyR && index !== 3) return null;
          return (
            <div key={spell.id} className="flex flex-col items-center max-w-[80px]">
              <Image
                src={SPELL_ICON_URL(spell.image.full)}
                alt={spell.name}
                width={40}
                height={40}
                title={spell.name}
                onError={(e) => {
                  if (isElectron) {
                    getAbilityIconUrl(spell.image.full).then((url) => {
                      if (url !== SPELL_ICON_URL(spell.image.full)) {
                        e.currentTarget.src = url;
                      }
                    });
                  }
                }}
              />
              <span className="text-sm text-center mt-1 font-bold">{["Q", "W", "E", "R"][index]}</span>
              <span className="text-sm text-center leading-tight font-medium">{spell.name}</span>
            </div>
          );
        })}
      </div>
    );
  }
);
TeamChampionAbilities.displayName = "TeamChampionAbilities";
