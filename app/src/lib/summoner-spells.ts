import { SummonerSpell } from "./types/summoner-spell";
import { summonerSpellCacheService } from "./services/assets/summoner-spell";
import { DDRAGON_CDN } from "@lib/services/common/constants";
import {
  getLatestVersion as getLatestDdragonVersion,
  loadListFromLocal,
  saveListToLocal,
  clearLocal,
  toLocalImageUrl
} from "@lib/services/common/unified-asset-cache";

const getLatestVersion = async (): Promise<string> => {
  return await getLatestDdragonVersion();
};

async function fetchSummonerSpellsFromAPI(): Promise<{
  spells: SummonerSpell[];
  version: string;
}> {
  const version = await getLatestVersion();

  const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/summoner.json`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  const spells: SummonerSpell[] = Object.values(data.data).map((spell: unknown) => {
    const s = spell as {
      _id: string;
      name: string;
      key: string;
      description: string;
      maxrank: number;
      cooldown: number[];
      cost: number[];
      range: number[];
      image: { full: string };
    };
    return {
      _id: s._id,
      name: s.name,
      key: s.key,
      description: s.description,
      maxrank: s.maxrank,
      cooldown: s.cooldown,
      cost: s.cost,
      range: s.range,
      image: `${DDRAGON_CDN}/${version}/img/spell/${s.image.full}`
    };
  });

  return { spells, version };
}

// Fetch CommunityDragon spells via API for browser environment
async function fetchCommunityDragonSpellsFromAPI(): Promise<SummonerSpell[]> {
  try {
    const version = await getLatestVersion();
    const { CommunityDragonSpellsService } = await import("@lib/services/assets/community-dragon-spells");
    
    const communitySpells = await CommunityDragonSpellsService.getAvailableSpells(version);
    
    return communitySpells.map((spell) => ({
      _id: spell.filename,
      name: spell.name,
      key: spell.filename.replace('.png', ''),
      description: `CommunityDragon spell: ${spell.name}`,
      maxrank: 1,
      cooldown: [0],
      cost: [0],
      range: [0],
      image: `/api/local-image?path=${encodeURIComponent(`assets/${version}/summoner-spells/${spell.filename}`)}`
    }));
  } catch (error) {
    console.warn("Failed to fetch CommunityDragon spells from API:", error);
    return [];
  }
}

// Electron file cache
async function loadFromElectronCache(): Promise<{
  spells: SummonerSpell[];
  timestamp: number;
} | null> {
  if (typeof window === "undefined" || !window.electronAPI) return null;

  try {
    const spells = await summonerSpellCacheService.getAllSummonerSpells();
    if (spells.length > 0) {
      return {
        spells: spells.map((s) => ({ ...s, image: toLocalImageUrl(s.image) })),
        timestamp: Date.now()
      };
    }
  } catch (error) {
    console.warn("Failed to load summoner spells from Electron cache:", error);
  }

  return null;
}

async function getSummonerSpellsFromComprehensiveCache(): Promise<SummonerSpell[]> {
  try {
    // Check if we're in Electron environment
    if (typeof window === "undefined" || !window.electronAPI) {
      // In browser environment, fetch both DataDragon and CommunityDragon spells
      const [dataDragonResult, communityDragonSpells] = await Promise.all([
        fetchSummonerSpellsFromAPI(),
        fetchCommunityDragonSpellsFromAPI()
      ]);
      
      // Combine both spell sources
      return [...dataDragonResult.spells, ...communityDragonSpells];
    }

    // const latest = await getLatestVersion();
    const spells = await summonerSpellCacheService.getAllSummonerSpells();
    console.log("Spells:", spells);

    if (spells.length === 0) {
      try {
        await summonerSpellCacheService.downloadAllSummonerSpellsOnStartup();
        const downloadedSpells = await summonerSpellCacheService.getAllSummonerSpells();
        return downloadedSpells;
      } catch (_error) {
        console.warn("Failed to download summoner spells:", _error);
        return [];
      }
    }

    // Note: summonerSpellCacheService hides version; fall back to versioned local cache check below
    return spells;
  } catch (error) {
    console.warn("Comprehensive summoner spell cache failed:", error);
    return [];
  }
}

// Basic cache logic (fallback)
async function getSummonerSpellsFromBasicCache(): Promise<SummonerSpell[]> {
  // Try Electron cache
  const electronCache = await loadFromElectronCache();
  if (electronCache) {
    return electronCache.spells;
  }

  // Try DataDragon API and CommunityDragon spells
  try {
    const [dataDragonResult, communityDragonSpells] = await Promise.all([
      fetchSummonerSpellsFromAPI(),
      fetchCommunityDragonSpellsFromAPI()
    ]);
    
    // Combine both spell sources and apply image URL transformation
    const allSpells = [...dataDragonResult.spells, ...communityDragonSpells];
    return allSpells.map((s) => ({ ...s, image: toLocalImageUrl(s.image) }));
  } catch (error) {
    console.error("Failed to fetch summoner spells from DataDragon:", error);
    return [];
  }
}

// Main cache logic
async function getSummonerSpellsFromCache(): Promise<SummonerSpell[]> {
  // Only try to fetch if we're in a browser environment
  if (typeof window !== "undefined") {
    try {
      const latest = await getLatestVersion();
      const spells = await getSummonerSpellsFromComprehensiveCache();
      if (spells.length > 0) {
        return spells.map((s) => ({ ...s, image: toLocalImageUrl(s.image) }));
      }
      const cached = loadListFromLocal<SummonerSpell>("summoner_spells");
      if (cached?.data && cached.version === latest) {
        return cached.data.map((s) => ({ ...s, image: toLocalImageUrl(s.image) }));
      }
      return await getSummonerSpellsFromBasicCache();
    } catch (error) {
      console.error("Error fetching summoner spells from comprehensive cache:", error);
      const latest = await getLatestVersion();
      const cached = loadListFromLocal<SummonerSpell>("summoner_spells");
      if (cached?.data && cached.version === latest) {
        return cached.data.map((s) => ({ ...s, image: toLocalImageUrl(s.image) }));
      }
      return await getSummonerSpellsFromBasicCache();
    }
  }

  // For SSR, return empty array
  return [];
}

// Public API
export async function getSummonerSpells(): Promise<SummonerSpell[]> {
  const result = await getSummonerSpellsFromCache();
  const version = await getLatestVersion();
  saveListToLocal("summoner_spells", result, version);
  return result;
}

export async function refreshSummonerSpellsCache(): Promise<SummonerSpell[]> {
  clearLocal("summoner_spells");
  if (typeof window !== "undefined" && window.electronAPI) {
    try {
      await summonerSpellCacheService.clearCache();
    } catch (error) {
      console.warn("Failed to clear comprehensive summoner spell cache:", error);
    }
  }

  return await getSummonerSpellsFromCache();
}

export const getSummonerSpellsCached = (): SummonerSpell[] => {
  const cached = loadListFromLocal<SummonerSpell>("summoner_spells");
  return cached?.data?.map((s) => ({ ...s, image: toLocalImageUrl(s.image) })) || [];
};

export const getSummonerSpellByKey = (key: string): SummonerSpell | undefined => {
  const spells = getSummonerSpellsCached();
  const found = spells.find((spell) => spell.key === key);

  return found;
};

export const getSummonerSpellById = (id: string): SummonerSpell | undefined => {
  const spells = getSummonerSpellsCached();
  return spells.find((spell) => spell._id === id);
};

export const getSummonerSpellByName = (name: string): SummonerSpell | undefined => {
  const spells = getSummonerSpellsCached();
  return spells.find((spell) => spell.name.toLowerCase() === name.toLowerCase());
};

// Enhanced summoner spell functions
export async function getSummonerSpellByKeyEnhanced(key: string): Promise<SummonerSpell | null> {
  if (typeof window !== "undefined") {
    try {
      return await summonerSpellCacheService.getById(key);
    } catch (error) {
      console.warn("Failed to get enhanced summoner spell data:", error);
      return getSummonerSpellByKey(key) || null;
    }
  }
  return getSummonerSpellByKey(key) || null;
}

export async function getSummonerSpellCacheStats(): Promise<{
  totalSpells: number;
  version: string;
} | null> {
  if (typeof window !== "undefined") {
    try {
      const spells = await summonerSpellCacheService.getAllSummonerSpells(true);
      return {
        totalSpells: spells.length,
        version: "latest" // We can't access the protected version method
      };
    } catch (error) {
      console.warn("Failed to get summoner spell cache stats:", error);
      return null;
    }
  }
  return null;
}
