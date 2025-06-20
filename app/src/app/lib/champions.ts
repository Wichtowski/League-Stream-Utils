import { Champion } from './types';
import { connectToDatabase } from './database/connection';
import { ChampionsCache } from './database/models';
import type { Document } from 'mongoose';
import { DDRAGON_CDN, DDRAGON_BASE_URL } from '@lib/constants';

interface DataDragonChampion {
  id: string;
  key: string;
  name: string;
  image: {
    full: string;
  };
}

interface DataDragonResponse {
  data: Record<string, DataDragonChampion>;
}


let memoryCache: Champion[] | null = null;

async function getLatestVersion(): Promise<string> {
  try {
    const response = await fetch(`${DDRAGON_BASE_URL}/api/versions.json`);
    const versions = await response.json();
    return versions[0];
  } catch (error) {
    console.error('Failed to fetch Data Dragon version:', error);
    return '15.11.1'; // Fallback version
  }
}

async function fetchChampionsFromAPI(): Promise<{ champions: Champion[], version: string }> {
  try {
    const version = await getLatestVersion();

    const response = await fetch(
      `${DDRAGON_CDN}/${version}/data/en_US/champion.json`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DataDragonResponse = await response.json();
    const champions: Champion[] = [];

    // Convert Data Dragon format to our Champion interface
    Object.values(data.data).forEach((champion: DataDragonChampion) => {
      champions.push({
        id: parseInt(champion.key),
        name: champion.name,
        key: champion.id,
        image: `${DDRAGON_CDN}/${version}/img/champion/${champion.image.full}`
      });
    });

    champions.sort((a, b) => a.name.localeCompare(b.name));

    return { champions, version };
  } catch (error) {
    console.error('Failed to fetch champions from Data Dragon:', error);

    const fallbackChampions = [
      { id: 1, name: "Annie", key: "Annie", image: `${DDRAGON_CDN}/15.11.1/img/champion/Annie.png` },
      { id: 103, name: "Ahri", key: "Ahri", image: `${DDRAGON_CDN}/15.11.1/img/champion/Ahri.png` },
      { id: 22, name: "Ashe", key: "Ashe", image: `${DDRAGON_CDN}/15.11.1/img/champion/Ashe.png` },
      { id: 51, name: "Caitlyn", key: "Caitlyn", image: `${DDRAGON_CDN}/15.11.1/img/champion/Caitlyn.png` },
      { id: 86, name: "Garen", key: "Garen", image: `${DDRAGON_CDN}/15.11.1/img/champion/Garen.png` },
      { id: 222, name: "Jinx", key: "Jinx", image: `${DDRAGON_CDN}/15.11.1/img/champion/Jinx.png` },
      { id: 64, name: "Lee Sin", key: "LeeSin", image: `${DDRAGON_CDN}/15.11.1/img/champion/LeeSin.png` },
      { id: 99, name: "Lux", key: "Lux", image: `${DDRAGON_CDN}/15.11.1/img/champion/Lux.png` },
      { id: 157, name: "Yasuo", key: "Yasuo", image: `${DDRAGON_CDN}/15.11.1/img/champion/Yasuo.png` },
      { id: 238, name: "Zed", key: "Zed", image: `${DDRAGON_CDN}/15.11.1/img/champion/Zed.png` }
    ];

    return { champions: fallbackChampions, version: '15.11.1' };
  }
}

// Get champions from MongoDB cache or fetch from API
async function getChampionsFromCache(): Promise<Champion[]> {
  try {
    await connectToDatabase();

    // Check for valid cache in MongoDB
    const cachedData = await ChampionsCache.findOne({
      expiresAt: { $gt: new Date() }
    }).sort({ lastUpdated: -1 });

    if (cachedData && cachedData.champions.length > 0) {
      memoryCache = cachedData.champions;
      return cachedData.champions;
    }

    // Cache expired or doesn't exist, fetch new data
    const { champions, version } = await fetchChampionsFromAPI();

    // Update cache in MongoDB
    await ChampionsCache.findOneAndUpdate(
      { version },
      {
        version,
        champions,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      },
      { upsert: true }
    );

    // Clean up old cache entries (keep only latest 3 versions)
    const allCaches = await ChampionsCache.find().sort({ lastUpdated: -1 });
    if (allCaches.length > 3) {
      const idsToDelete = allCaches.slice(3).map((cache: Document) => cache._id);
      await ChampionsCache.deleteMany({ _id: { $in: idsToDelete } });
    }

    memoryCache = champions;
    return champions;

  } catch (error) {
    console.error('Error accessing MongoDB cache:', error);

    // Fallback to memory cache if available
    if (memoryCache) {
      return memoryCache;
    }

    // Last resort: fetch directly from API
    const { champions } = await fetchChampionsFromAPI();
    memoryCache = champions;
    return champions;
  }
}

// Get all champions (with caching)
export async function getChampions(): Promise<Champion[]> {
  return await getChampionsFromCache();
}

// Force refresh champions cache
export async function refreshChampionsCache(): Promise<Champion[]> {
  try {
    await connectToDatabase();

    // Clear all cache entries
    await ChampionsCache.deleteMany({});
    memoryCache = null;

    return await getChampionsFromCache();
  } catch (error) {
    console.error('Error refreshing champions cache:', error);
    const { champions } = await fetchChampionsFromAPI();
    memoryCache = champions;
    return champions;
  }
}

// Get champions synchronously (returns cached data or empty array)
export const getChampionsCached = (): Champion[] => {
  return memoryCache || [];
};

export const getChampionById = async (id: number): Promise<Champion | undefined> => {
  const champions = await getChampions();
  return champions.find(champion => champion.id === id);
};

export const getChampionByKey = async (key: string): Promise<Champion | undefined> => {
  const champions = await getChampions();
  return champions.find(champion => champion.key === key);
};

export const searchChampions = async (query: string): Promise<Champion[]> => {
  const champions = await getChampions();
  const lowerQuery = query.toLowerCase();
  return champions.filter(champion =>
    champion.name.toLowerCase().includes(lowerQuery) ||
    champion.key.toLowerCase().includes(lowerQuery)
  );
};

// Initialize champions cache on module load (for server-side)
if (typeof window === 'undefined') {
  getChampions().catch(console.error);
} 