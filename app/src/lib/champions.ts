import { Champion } from "./types";
import { DDRAGON_CDN } from "@lib/services/common/constants";
import { championCacheService } from "@lib/services/assets/champion";
import { getLatestVersion as getLatestDdragonVersion, saveListToLocal, loadListFromLocal, clearLocal, toLocalImageUrl } from "@lib/services/common/unified-asset-cache";

interface DataDragonChampion {
  id: string;
  key: string;
  name: string;
  image: {
    full: string;
  };
}

interface DataDragonResponse {
  data: { [key: string]: DataDragonChampion };
}

async function getLatestVersion(): Promise<string> {
  return await getLatestDdragonVersion();
}

async function fetchChampionsFromAPI(): Promise<{
  champions: Champion[];
  version: string;
}> {
  const version = await getLatestVersion();

  const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/champion.json`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: DataDragonResponse = await response.json();

  const champions: Champion[] = Object.values(data.data).map((champ: DataDragonChampion) => ({
    id: parseInt(champ.key),
    name: champ.name,
    key: champ.id,
    image: `${DDRAGON_CDN}/${version}/img/champion/${champ.image.full}`
  }));

  return { champions, version };
}

function loadFromLocalStorage(): { champions: Champion[]; version: string; timestamp: number } | null {
  const data = loadListFromLocal<Champion>("champions");
  if (!data) return null;
  return { champions: data.data, version: data.version, timestamp: data.timestamp };
}

// Electron file cache
async function saveToElectronCache(champions: Champion[], version: string): Promise<void> {
  if (typeof window !== "undefined" && window.electronAPI) {
    try {
      await window.electronAPI.saveChampionsCache({
        champions,
        version,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.warn("Failed to save champions to Electron cache:", error);
    }
  }
}

async function loadFromElectronCache(): Promise<{
  champions: Champion[];
  version: string;
  timestamp: number;
} | null> {
  if (typeof window === "undefined" || !window.electronAPI) return null;

  try {
    const result = await window.electronAPI.loadChampionsCache();
    if (!result.success || !result.data) return null;

    const timestamp = new Date(result.data.lastUpdated).getTime();
    return {
      champions: result.data.champions,
      version: result.data.version,
      timestamp
    };
  } catch (error) {
    console.warn("Failed to load champions from Electron cache:", error);
    return null;
  }
}

async function getChampionsFromComprehensiveCache(): Promise<Champion[]> {
  try {
    const champs = await championCacheService.getAllChampions();
    return champs.map((c) => ({
      ...c,
      image: toLocalImageUrl(c.image),
      squareImg: c.squareImg ? toLocalImageUrl(c.squareImg) : c.squareImg,
      splashCenteredImg: c.splashCenteredImg ? toLocalImageUrl(c.splashCenteredImg) : c.splashCenteredImg,
      splashImg: c.splashImg ? toLocalImageUrl(c.splashImg) : c.splashImg,
      loadingImg: c.loadingImg ? toLocalImageUrl(c.loadingImg) : c.loadingImg
    }));
  } catch (error) {
    console.warn("Comprehensive champion cache failed, falling back to basic cache:", error);
    return await getChampionsFromBasicCache();
  }
}

async function getChampionsFromBasicCache(): Promise<Champion[]> {
  const electronCache = await loadFromElectronCache();
  if (electronCache) {
    return electronCache.champions.map((c: Champion) => ({ ...c, image: toLocalImageUrl(c.image) }));
  }

  const localCache: { champions: Champion[]; version: string; timestamp: number } | null = loadFromLocalStorage();
  if (localCache) {
    return localCache.champions.map((c: Champion) => ({ ...c, image: toLocalImageUrl(c.image) }));
  }

  try {
    const { champions, version } = await fetchChampionsFromAPI();
    saveListToLocal("champions", champions, version);
    await saveToElectronCache(champions, version);
    return champions.map((c: Champion) => ({ ...c, image: toLocalImageUrl(c.image) }));
  } catch (error) {
    console.error("Error fetching champions from API:", error);
    const fallback = loadFromLocalStorage();
    if (fallback) return fallback.champions.map((c: Champion) => ({ ...c, image: toLocalImageUrl(c.image) }));
    return [];
  }
}

async function getChampionsFromCache(): Promise<Champion[]> {
  if (typeof window !== "undefined" && window.electronAPI) {
    return await getChampionsFromComprehensiveCache();
  }
  return await getChampionsFromBasicCache();
}

// Public API
export async function getChampions(): Promise<Champion[]> {
  const result = await getChampionsFromCache();
  const version = await getLatestVersion();
  saveListToLocal("champions", result, version);
  return result;
}

export async function refreshChampionsCache(): Promise<Champion[]> {
  clearLocal("champions");
  if (typeof window !== "undefined" && window.electronAPI) {
    try {
      await championCacheService.clearCache();
    } catch (error) {
      console.warn("Failed to clear comprehensive champion cache:", error);
    }
  }
  return await getChampionsFromCache();
}

export const getChampionsCached = (): Champion[] => {
  const data = loadListFromLocal<Champion>("champions");
  return data?.data?.map((c) => ({ ...c, image: toLocalImageUrl(c.image) })) || [];
};

export const getChampionByKey = (key: string): Champion | undefined => {
  const champions = getChampionsCached();
  return champions.find((champ) => champ.key === key);
};

export const getChampionById = (id: number): Champion | undefined => {
  const champions = getChampionsCached();
  return champions.find((champ) => champ.id === id);
};

export const getChampionByName = (name: string): Champion | undefined => {
  const champions = getChampionsCached();
  return champions.find((champ) => champ.name.toLowerCase() === name.toLowerCase());
};

// Enhanced champion functions
export async function getChampionByKeyEnhanced(key: string): Promise<Champion | null> {
  if (typeof window !== "undefined" && window.electronAPI) {
    try {
      const c = await championCacheService.getChampionByKey(key);
      return c
        ? {
            ...c,
            image: toLocalImageUrl(c.image),
            squareImg: c.squareImg ? toLocalImageUrl(c.squareImg) : c.squareImg,
            splashCenteredImg: c.splashCenteredImg ? toLocalImageUrl(c.splashCenteredImg) : c.splashCenteredImg,
            splashImg: c.splashImg ? toLocalImageUrl(c.splashImg) : c.splashImg,
            loadingImg: c.loadingImg ? toLocalImageUrl(c.loadingImg) : c.loadingImg
          }
        : null;
    } catch (error) {
      console.warn("Failed to get enhanced champion data:", error);
      return getChampionByKey(key) || null;
    }
  }
  return getChampionByKey(key) || null;
}

export async function getChampionCacheStats(): Promise<{
  totalChampions: number;
  cacheSize: number;
  version: string;
} | null> {
  if (typeof window !== "undefined" && window.electronAPI) {
    try {
      return await championCacheService.getCacheStats();
    } catch (error) {
      console.warn("Failed to get champion cache stats:", error);
      return null;
    }
  }
  return null;
}
