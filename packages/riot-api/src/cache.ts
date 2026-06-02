const CACHE_TTL = 24 * 60 * 60 * 1000;

interface StoredData<T> {
  data: T;
  version: string;
  timestamp: number;
}

type CacheKind = 'champions' | 'items' | 'summoner_spells' | 'runes';

function storageKey(kind: CacheKind) {
  return `lsu_${kind}_cache`;
}

export function saveToCache<T>(kind: CacheKind, data: T, version: string) {
  if (typeof window === 'undefined') return;
  const stored: StoredData<T> = { data, version, timestamp: Date.now() };
  try {
    localStorage.setItem(storageKey(kind), JSON.stringify(stored));
  } catch {
    // storage full — ignore
  }
}

export function loadFromCache<T>(kind: CacheKind): StoredData<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(kind));
    if (!raw) return null;
    const stored: StoredData<T> = JSON.parse(raw);
    if (Date.now() - stored.timestamp > CACHE_TTL) {
      localStorage.removeItem(storageKey(kind));
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

export function clearCache(kind: CacheKind) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(storageKey(kind));
}

export function clearAllCaches() {
  const kinds: CacheKind[] = ['champions', 'items', 'summoner_spells', 'runes'];
  kinds.forEach(clearCache);
}

export function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}
