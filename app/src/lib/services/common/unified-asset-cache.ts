import { DataDragonClient } from "@lib/services/external/DataDragon/client";

export type AssetKind = "champions" | "items" | "summoner_spells";

interface StoredList<T> {
  data: T[];
  version: string;
  timestamp: number;
}

const STORAGE_KEYS: Record<AssetKind, string> = {
  champions: "champions_cache",
  items: "items_cache",
  summoner_spells: "summoner_spells_cache"
};

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

export const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION_MS;
};

export const getLatestVersion = async (): Promise<string> => {
  return await DataDragonClient.getLatestVersion();
};

export const saveListToLocal = <T>(kind: AssetKind, data: T[], version: string): void => {
  if (typeof localStorage === "undefined") return;
  const payload: StoredList<T> = {
    data,
    version,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(payload));
};

export const clearLocal = (kind: AssetKind): void => {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS[kind]);
};

export const loadListFromLocal = <T>(kind: AssetKind): StoredList<T> | null => {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS[kind]);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredList<T>;
    if (!Array.isArray(parsed.data) || !parsed.timestamp) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const toLocalImageUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) return "";
  // Convert known DataDragon URLs to local asset paths
  if (/^https?:\/\//i.test(pathOrUrl)) {
    const spellMatch = pathOrUrl.match(/\/cdn\/([^/]+)\/img\/spell\/([^/]+\.png)$/i);
    if (spellMatch) {
      const version = spellMatch[1];
      const file = spellMatch[2];
      const rel = `assets/${version}/summoner-spells/${file}`;
      return `/api/local-image?path=${encodeURIComponent(rel)}`;
    }
    const itemMatch = pathOrUrl.match(/\/cdn\/([^/]+)\/img\/item\/([^/]+\.png)$/i);
    if (itemMatch) {
      const version = itemMatch[1];
      const file = itemMatch[2];
      const rel = `assets/${version}/items/${file}`;
      return `/api/local-image?path=${encodeURIComponent(rel)}`;
    }
    const champSquareMatch = pathOrUrl.match(/\/cdn\/([^/]+)\/img\/champion\/([^/.]+)\.png$/i);
    if (champSquareMatch) {
      const version = champSquareMatch[1];
      const champKey = champSquareMatch[2];
      const rel = `assets/${version}/champions/${champKey}/square.png`;
      return `/api/local-image?path=${encodeURIComponent(rel)}`;
    }
    return pathOrUrl;
  }
  let rel = pathOrUrl.replace(/^file:\/\//i, "").replace(/\\/g, "/");
  const hostedIdx = rel.indexOf("hosted/assets/");
  if (hostedIdx !== -1) {
    rel = rel.substring(hostedIdx + "hosted/assets/".length);
  }
  // Handle bare version-prefixed paths like "15.16.1/summoner-spells/XYZ.png"
  if (/^\d+\.\d+\.\d+\//.test(rel) && !rel.startsWith("assets/")) {
    rel = `assets/${rel}`;
  }
  if (rel.startsWith("assets/")) {
    rel = rel.substring("assets/".length);
  }
  if (!rel.startsWith("assets/")) return pathOrUrl;
  return `/api/local-image?path=${encodeURIComponent(rel)}`;
};
