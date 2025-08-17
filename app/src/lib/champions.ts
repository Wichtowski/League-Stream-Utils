import { Champion } from "./types";
import { DDRAGON_CDN, DDRAGON_BASE_URL } from "@lib/services/common/constants";
import { championCacheService } from "@lib/services/assets/champion";

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

// Memory cache for quick access
let memoryCache: Champion[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function getLatestVersion(): Promise<string> {
  try {
    const response = await fetch(`${DDRAGON_BASE_URL}/api/versions.json`);
    const versions = await response.json();
    return versions[0];
  } catch (error) {
    console.error("Failed to fetch Data Dragon version:", error);
    return "15.15.1"; // Fallback version
  }
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

// Check if cache is valid
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

// Browser localStorage cache
function saveToLocalStorage(champions: Champion[], version: string): void {
  if (typeof localStorage !== "undefined") {
    try {
      const cacheData = {
        champions,
        version,
        timestamp: Date.now()
      };
      localStorage.setItem("champions_cache", JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Failed to save champions to localStorage:", error);
    }
  }
}

function loadFromLocalStorage(): {
  champions: Champion[];
  version: string;
  timestamp: number;
} | null {
  if (typeof localStorage === "undefined") return null;

  try {
    const cached = localStorage.getItem("champions_cache");
    if (!cached) return null;

    const data = JSON.parse(cached);
    if (!data.champions || !data.timestamp) return null;

    return data;
  } catch (error) {
    console.warn("Failed to load champions from localStorage:", error);
    return null;
  }
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

// Enhanced champion caching system
async function getChampionsFromComprehensiveCache(): Promise<Champion[]> {
  try {
    // Try to use the new comprehensive caching system
    return await championCacheService.getAllChampions();
  } catch (error) {
    console.warn("Comprehensive champion cache failed, falling back to basic cache:", error);
    return await getChampionsFromBasicCache();
  }
}

// Basic cache logic (fallback)
async function getChampionsFromBasicCache(): Promise<Champion[]> {
  // Check memory cache first
  if (memoryCache && cacheTimestamp && isCacheValid(cacheTimestamp)) {
    return memoryCache;
  }

  // Try Electron cache
  const electronCache = await loadFromElectronCache();
  if (electronCache && isCacheValid(electronCache.timestamp)) {
    memoryCache = electronCache.champions;
    cacheTimestamp = electronCache.timestamp;
    return electronCache.champions;
  }

  // Try browser localStorage cache
  const localCache = loadFromLocalStorage();
  if (localCache && isCacheValid(localCache.timestamp)) {
    memoryCache = localCache.champions;
    cacheTimestamp = localCache.timestamp;
    return localCache.champions;
  }

  // Cache expired or doesn't exist, fetch from API
  try {
    const { champions, version } = await fetchChampionsFromAPI();

    // Update all caches
    memoryCache = champions;
    cacheTimestamp = Date.now();

    // Save to appropriate cache
    saveToLocalStorage(champions, version);
    await saveToElectronCache(champions, version);

    return champions;
  } catch (error) {
    console.error("Error fetching champions from API:", error);

    // Try to return stale cache as fallback
    if (electronCache) return electronCache.champions;
    if (localCache) return localCache.champions;
    if (memoryCache) return memoryCache;

    throw error;
  }
}

// Main cache logic
async function getChampionsFromCache(): Promise<Champion[]> {
  // Check if we're in Electron environment and should use comprehensive caching
  if (typeof window !== "undefined" && window.electronAPI) {
    return await getChampionsFromComprehensiveCache();
  }

  // Fallback to basic caching for web environment
  return await getChampionsFromBasicCache();
}

// Public API
export async function getChampions(): Promise<Champion[]> {
  return await getChampionsFromCache();
}

export async function refreshChampionsCache(): Promise<Champion[]> {
  // Clear all caches
  memoryCache = null;
  cacheTimestamp = null;

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("champions_cache");
  }

  // Clear comprehensive cache if available
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
  return memoryCache || [];
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
      return await championCacheService.getChampionByKey(key);
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

// Initialize champions cache on module load (for server-side)
if (typeof window === "undefined") {
  getChampions().catch(console.error);
}
