import { Item } from "./types";
import { DDRAGON_CDN } from "@lib/services/common/constants";
import { itemCacheService } from "@lib/services/assets/item";
import {
  getLatestVersion as getLatestDdragonVersion,
  saveListToLocal,
  loadListFromLocal,
  toLocalImageUrl
} from "@lib/services/common/unified-asset-cache";

const getLatestVersion = async (): Promise<string> => {
  return await getLatestDdragonVersion();
};

async function fetchItemsFromAPI(): Promise<{ items: Item[]; version: string }> {
  const version = await getLatestVersion();
  const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/item.json`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = (await response.json()) as {
    data: Record<
      string,
      {
        name: string;
        description: string;
        plaintext: string;
        gold?: { total?: number; sell?: number };
        tags?: string[];
        stats?: Record<string, number>;
        image?: { full?: string };
        into?: string[];
        from?: string[];
      }
    >;
  };
  const items: Item[] = Object.entries(data.data).map(([id, item]) => ({
    _id: id,
    name: item.name,
    description: item.description,
    plaintext: item.plaintext,
    cost: item.gold?.total ?? 0,
    sellValue: item.gold?.sell ?? 0,
    tags: Array.isArray(item.tags) ? item.tags : [],
    stats: item.stats ?? {},
    image: `${DDRAGON_CDN}/${version}/img/item/${item.image?.full ?? `${id}.png`}`,
    buildPath: {
      into: Array.isArray(item.into) ? item.into : [],
      from: Array.isArray(item.from) ? item.from : []
    }
  }));
  return { items, version };
}

async function loadFromElectronCache(): Promise<{ items: Item[]; timestamp: number } | null> {
  if (typeof window === "undefined" || !window.electronAPI) return null;
  try {
    const items = await itemCacheService.getAllItems();
    if (items.length > 0) {
      const mapped: Item[] = items.map((i) => ({
        _id: i.id,
        name: i.name,
        description: i.description,
        plaintext: i.plaintext,
        cost: i.cost,
        sellValue: i.sellValue,
        tags: i.tags,
        stats: i.stats,
        image: toLocalImageUrl(i.image),
        buildPath: {
          into: i.buildPath.into,
          from: i.buildPath.from
        }
      }));
      return { items: mapped, timestamp: Date.now() };
    }
  } catch (_error) {
    return null;
  }
  return null;
}

async function getItemsFromBasicCache(): Promise<Item[]> {
  const latest = await getLatestVersion();

  const electronCache = await loadFromElectronCache();
  if (electronCache) return electronCache.items; // Electron service already uses latest internally

  const cached = loadListFromLocal<Item>("items");
  if (cached && cached.version === latest) {
    return cached.data.map((i) => ({ ...i, image: toLocalImageUrl(i.image) }));
  }

  const { items, version } = await fetchItemsFromAPI();
  saveListToLocal("items", items, version);
  return items.map((i) => ({ ...i, image: toLocalImageUrl(i.image) }));
}

async function getItemsFromCache(): Promise<Item[]> {
  if (typeof window !== "undefined") {
    try {
      return await getItemsFromBasicCache();
    } catch (_error) {
      const latest = await getLatestVersion();
      const cached = loadListFromLocal<Item>("items");
      if (cached && cached.version === latest) {
        return cached.data.map((i) => ({ ...i, image: toLocalImageUrl(i.image) }));
      }
      return [];
    }
  }
  return [];
}

export async function getItems(): Promise<Item[]> {
  const result = await getItemsFromCache();
  const version = await getLatestVersion();
  saveListToLocal("items", result, version);
  return result;
}

// removed: normalizeImagePath (now handled by toLocalImageUrl)

export const getItemImage = (itemId: number | string): string => {
  if (!itemId) return "";
  const id = String(itemId);
  const cached = loadListFromLocal<Item>("items");
  if (cached?.data?.length) {
    const found = cached.data.find((i) => (i as Item)._id === id);
    if (found?.image) return toLocalImageUrl(found.image);
  }
  return toLocalImageUrl(`assets/${id}.png`);
};

export const getItemsCached = (): Item[] => {
  const cached = loadListFromLocal<Item>("items");
  return cached?.data?.map((i) => ({ ...i, image: toLocalImageUrl(i.image) })) || [];
};

export const getItemById = (id: string): Item | undefined => {
  const items = getItemsCached();
  return items.find((i) => i._id === id);
};
