import { SummonerSpell } from "./types/summoner-spell";
import { summonerSpellCacheService } from "./services/assets/summoner-spell";
import { DDRAGON_CDN, DDRAGON_BASE_URL } from "@lib/services/common/constants";

// Memory cache for quick access
let memoryCache: SummonerSpell[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Check if cache is valid
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

async function getLatestVersion(): Promise<string> {
  try {
    const response = await fetch(`${DDRAGON_BASE_URL}/api/versions.json`);
    const versions = await response.json();
    return versions[0];
  } catch (error) {
    console.error("Failed to fetch Data Dragon version:", error);
    return "15.16.1"; // Fallback version
  }
}

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
    const s = spell as { id: string; name: string; key: string; description: string; maxrank: number; cooldown: number[]; cost: number[]; range: number[]; image: { full: string } };
    return {
      id: s.id,
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
        spells,
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
      console.log("Not in Electron environment, fetching from DataDragon API");
      return await fetchSummonerSpellsFromAPI().then(data => data.spells);
    }

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
    
    return spells;
  } catch (error) {
    console.warn("Comprehensive summoner spell cache failed:", error);
    return [];
  }
}

// Basic cache logic (fallback)
async function getSummonerSpellsFromBasicCache(): Promise<SummonerSpell[]> {
  // Check memory cache first
  if (memoryCache && cacheTimestamp && isCacheValid(cacheTimestamp)) {
    return memoryCache;
  }

  // Try Electron cache
  const electronCache = await loadFromElectronCache();
  if (electronCache && isCacheValid(electronCache.timestamp)) {
    memoryCache = electronCache.spells;
    cacheTimestamp = electronCache.timestamp;
    return electronCache.spells;
  }

  // Try DataDragon API
  try {
    const { spells } = await fetchSummonerSpellsFromAPI();
      
    // Update memory cache
    memoryCache = spells;
    cacheTimestamp = Date.now();
      
    return spells;
  } catch (error) {
    console.error("Failed to fetch summoner spells from DataDragon:", error);
    return [];
  }
}

// Main cache logic
async function getSummonerSpellsFromCache(): Promise<SummonerSpell[]> {
  // Check memory cache first
  if (memoryCache && cacheTimestamp && isCacheValid(cacheTimestamp)) {
    return memoryCache;
  }

  // Only try to fetch if we're in a browser environment
  if (typeof window !== "undefined") {
    try {
      const spells = await getSummonerSpellsFromComprehensiveCache();
      
      // Update memory cache
      memoryCache = spells;
      cacheTimestamp = Date.now();
      
      return spells;
    } catch (error) {
      console.error("Error fetching summoner spells from comprehensive cache:", error);
      // Return stale cache if available
      if (memoryCache) return memoryCache;
      
      // Fallback to basic cache (DataDragon API)
      return await getSummonerSpellsFromBasicCache();
    }
  }

  // For SSR, return empty array
  return [];
}

// Public API
export async function getSummonerSpells(): Promise<SummonerSpell[]> {
  const result = await getSummonerSpellsFromCache();
  return result;
}

export async function refreshSummonerSpellsCache(): Promise<SummonerSpell[]> {
  // Clear all caches
  memoryCache = null;
  cacheTimestamp = null;

  // Clear comprehensive cache if available
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
  return memoryCache || [];
};

export const getSummonerSpellByKey = (key: string): SummonerSpell | undefined => {
  const spells = getSummonerSpellsCached();
  console.log("🔍 getSummonerSpellByKey looking for:", key, "in", spells.length, "spells");
  
  // Debug: log all available keys
  console.log("🔍 Available keys:", spells.map(s => s.key));
  
  const found = spells.find((spell) => spell.key === key);
  console.log("🔍 Found spell:", found);
  return found;
};

export const getSummonerSpellById = (id: string): SummonerSpell | undefined => {
  const spells = getSummonerSpellsCached();
  return spells.find((spell) => spell.id === id);
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


