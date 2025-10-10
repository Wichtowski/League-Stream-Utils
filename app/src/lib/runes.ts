import { DataDragonClient, RuneReforged } from "@lib/services/external/DataDragon/client";
import { DDRAGON_CDN } from "@lib/services/common/constants";
import {
  getLatestVersion as getLatestDdragonVersion,
  toLocalImageUrl
} from "@lib/services/common/unified-asset-cache";

interface RuneTree {
  id: number;
  key: string;
  icon: string;
  name: string;
}

interface StoredRunes {
  data: RuneTree[];
  version: string;
  timestamp: number;
}

const CACHE_KEY = "runes_cache";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

const getLatestVersion = async (): Promise<string> => {
  return await getLatestDdragonVersion();
};

async function fetchRunesFromAPI(): Promise<{ runes: RuneTree[]; version: string }> {
  const version = await getLatestVersion();
  const runesData: RuneReforged[] = await DataDragonClient.getRunes(version);
  
  const runes: RuneTree[] = runesData.map((tree) => {
    const rawUrl = `${DDRAGON_CDN}/${version}/img/${tree.icon}`;
    return {
      id: tree.id,
      key: tree.key,
      icon: toLocalImageUrl(rawUrl),
      name: tree.name
    };
  });

  return { runes, version };
}

function loadFromLocalStorage(): StoredRunes | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredRunes;
    if (!Array.isArray(parsed.data) || !parsed.timestamp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToLocalStorage(runes: RuneTree[], version: string): void {
  if (typeof localStorage === "undefined") return;
  const payload: StoredRunes = {
    data: runes,
    version,
    timestamp: Date.now()
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION_MS;
}

async function getRunesFromCache(): Promise<RuneTree[]> {
  const latest = await getLatestVersion();
  
  const cached = loadFromLocalStorage();
  if (cached && cached.version === latest && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  try {
    const { runes, version } = await fetchRunesFromAPI();
    saveToLocalStorage(runes, version);
    return runes;
  } catch (error) {
    console.error("Error fetching runes from API:", error);
    if (cached) {
      return cached.data;
    }
    return [];
  }
}

export async function getRunes(): Promise<RuneTree[]> {
  return await getRunesFromCache();
}

export const getRunesCached = (): RuneTree[] => {
  const cached = loadFromLocalStorage();
  return cached?.data || [];
};

export const getRuneImage = (treeName?: string): string => {
  if (!treeName) return "";
  
  const cached = loadFromLocalStorage();
  if (!cached?.data) return "";
  
  const normalizedName = treeName.trim().toLowerCase();
  const tree = cached.data.find(
    (r) => 
      r.name.toLowerCase() === normalizedName || 
      r.key.toLowerCase() === normalizedName
  );
  
  return tree?.icon || "";
};


