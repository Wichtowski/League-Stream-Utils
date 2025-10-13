import { DataDragonClient, RuneReforged } from "@lib/services/external/DataDragon/client";
import { getLatestVersion as getLatestDdragonVersion } from "@lib/services/common/unified-asset-cache";

interface RuneTree {
  id: number;
  key: string;
  icon: string;
  name: string;
}

interface KeystoneRune {
  id: number;
  key: string;
  icon: string;
  name: string;
  treeKey: string;
  treeName: string;
}

interface StoredRunesDataV2 {
  trees: RuneTree[];
  keystones: KeystoneRune[];
}

interface StoredRunesV1 {
  data: RuneTree[];
  version: string;
  timestamp: number;
}

interface StoredRunesV1WithKeystones extends StoredRunesV1 {
  keystones?: KeystoneRune[];
}

interface StoredRunesV2 {
  data: StoredRunesDataV2;
  version: string;
  timestamp: number;
}

type StoredRunes = StoredRunesV2 | StoredRunesV1 | StoredRunesV1WithKeystones;

const CACHE_KEY = "runes_cache";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

const getLatestVersion = async (): Promise<string> => {
  return await getLatestDdragonVersion();
};

async function fetchRunesFromAPI(): Promise<{ trees: RuneTree[]; keystones: KeystoneRune[]; version: string }> {
  const version = await getLatestVersion();
  const runesData: RuneReforged[] = await DataDragonClient.getRunes(version);

  const trees: RuneTree[] = runesData.map((tree) => {
    const fileName = (tree.icon.split("/").pop() || "").toLowerCase();
    const localPath = `assets/${version}/runes/${fileName}`;
    return {
      id: tree.id,
      key: tree.key,
      icon: `/api/local-image?path=${encodeURIComponent(localPath)}`,
      name: tree.name
    };
  });

  const keystones: KeystoneRune[] = runesData.flatMap((tree) => {
    const firstSlot = tree.slots?.[0];
    const runesInSlot = firstSlot?.runes || [];
    return runesInSlot.map((r) => {
      const fileName = (r.icon.split("/").pop() || "").toLowerCase();
      const localPath = `assets/${version}/runes/${fileName}`;
      return {
        id: r.id,
        key: r.key,
        icon: `/api/local-image?path=${encodeURIComponent(localPath)}`,
        name: r.name,
        treeKey: tree.key,
        treeName: tree.name
      } as KeystoneRune;
    });
  });

  return { trees, keystones, version };
}

function loadFromLocalStorage(): StoredRunes | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredRunes;
    if ((parsed as StoredRunesV2).data && (parsed as StoredRunesV2).data.trees && parsed.timestamp) return parsed;
    if ((parsed as StoredRunesV1).data && parsed.timestamp) return parsed;
    return parsed;
  } catch {
    return null;
  }
}

function saveToLocalStorage(trees: RuneTree[], version: string, keystones?: KeystoneRune[]): void {
  if (typeof localStorage === "undefined") return;
  const payload: StoredRunesV2 = {
    data: {
      trees,
      keystones: keystones || []
    },
    version,
    timestamp: Date.now(),
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
    if ((cached as StoredRunesV2).data && (cached as StoredRunesV2).data.trees) {
      return (cached as StoredRunesV2).data.trees;
    }
    return (cached as StoredRunesV1).data;
  }

  try {
    const { trees, keystones, version } = await fetchRunesFromAPI();
    saveToLocalStorage(trees, version, keystones);
    return trees;
  } catch (error) {
    console.error("Error fetching runes from API:", error);
    if (cached) {
      if ((cached as StoredRunesV2).data && (cached as StoredRunesV2).data.trees) {
        return (cached as StoredRunesV2).data.trees;
      }
      return (cached as StoredRunesV1).data;
    }
    return [];
  }
}

export async function getRunes(): Promise<RuneTree[]> {
  return await getRunesFromCache();
}

export const getRunesCached = (): RuneTree[] => {
  const cached = loadFromLocalStorage();
  if (!cached) return [];
  if ((cached as StoredRunesV2).data && (cached as StoredRunesV2).data.trees) {
    return (cached as StoredRunesV2).data.trees;
  }
  return (cached as StoredRunesV1).data || [];
};

export const getKeystonesCached = (): KeystoneRune[] => {
  const cached = loadFromLocalStorage();
  if (!cached) return [];
  if ((cached as StoredRunesV2).data && (cached as StoredRunesV2).data.keystones) {
    return (cached as StoredRunesV2).data.keystones;
  }
  return ((cached as StoredRunesV1WithKeystones).keystones || []);
};

export const getRuneImage = (nameOrKey?: string): string => {
  if (!nameOrKey) return "";

  const cached = loadFromLocalStorage();
  if (!cached) return "";

  const normalized = nameOrKey.trim();

  const trees = (cached as StoredRunesV2).data && (cached as StoredRunesV2).data.trees
    ? (cached as StoredRunesV2).data.trees
    : (cached as StoredRunesV1).data;
  const keystones = (cached as StoredRunesV2).data && (cached as StoredRunesV2).data.keystones
    ? (cached as StoredRunesV2).data.keystones
    : (cached as StoredRunesV1WithKeystones).keystones || [];

  const tree = trees?.find((r) => r.name === normalized || r.key === normalized);
  if (tree?.icon) return tree.icon;

  const ks = keystones?.find((k) => k.name === normalized || k.key === normalized);
  if (ks?.icon) return ks.icon;

  return "";
};
