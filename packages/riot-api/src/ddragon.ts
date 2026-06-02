const BASE_URL = 'https://ddragon.leagueoflegends.com';
const FALLBACK_VERSION = '15.20.1';
const FETCH_TIMEOUT = 15_000;

async function fetchWithTimeout<T>(url: string, timeout = FETCH_TIMEOUT): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`DDragon ${res.status}: ${url}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

let cachedVersion: string | null = null;
let versionFetchedAt = 0;
const VERSION_TTL = 60 * 60 * 1000;

export async function getLatestVersion(): Promise<string> {
  if (cachedVersion && Date.now() - versionFetchedAt < VERSION_TTL) {
    return cachedVersion;
  }
  try {
    const versions = await fetchWithTimeout<string[]>(`${BASE_URL}/api/versions.json`, 10_000);
    cachedVersion = versions[0] ?? FALLBACK_VERSION;
    versionFetchedAt = Date.now();
    return cachedVersion;
  } catch {
    return cachedVersion ?? FALLBACK_VERSION;
  }
}

export async function getAllVersions(): Promise<string[]> {
  return fetchWithTimeout<string[]>(`${BASE_URL}/api/versions.json`, 10_000);
}

interface DDragonChampion {
  key: string;
  id: string;
  name: string;
  title: string;
  tags: string[];
  image: { full: string };
  stats: Record<string, number>;
  spells?: Array<{ id: string; name: string; image: { full: string } }>;
  passive?: { name: string; image: { full: string } };
}

interface DDragonItem {
  name: string;
  description: string;
  plaintext: string;
  gold: { total: number; sell: number };
  tags: string[];
  stats: Record<string, number>;
  image: { full: string };
  into?: string[];
  from?: string[];
}

interface DDragonSummonerSpell {
  key: string;
  id: string;
  name: string;
  description: string;
  image: { full: string };
}

interface DDragonRuneTree {
  id: number;
  key: string;
  name: string;
  icon: string;
  slots: Array<{ runes: Array<{ id: number; key: string; name: string; icon: string }> }>;
}

export async function fetchChampions(version?: string) {
  const v = version ?? (await getLatestVersion());
  const data = await fetchWithTimeout<{ data: Record<string, DDragonChampion> }>(
    `${BASE_URL}/cdn/${v}/data/en_US/champion.json`,
  );
  return Object.values(data.data).map((c) => ({
    id: Number(c.key),
    name: c.name,
    key: c.id,
    title: c.title,
    tags: c.tags,
    image: `${BASE_URL}/cdn/${v}/img/champion/${c.image.full}`,
    splashImg: `${BASE_URL}/cdn/img/champion/splash/${c.id}_0.jpg`,
    loadingImg: `${BASE_URL}/cdn/img/champion/loading/${c.id}_0.jpg`,
    squareImg: `${BASE_URL}/cdn/${v}/img/champion/${c.image.full}`,
  }));
}

export async function fetchChampionDetail(championKey: string, version?: string) {
  const v = version ?? (await getLatestVersion());
  const data = await fetchWithTimeout<{ data: Record<string, DDragonChampion> }>(
    `${BASE_URL}/cdn/${v}/data/en_US/champion/${championKey}.json`,
  );
  const c = Object.values(data.data)[0];
  if (!c) return null;

  const spells = (c.spells ?? []).map((s) => ({
    spellName: s.name,
    iconAsset: `${BASE_URL}/cdn/${v}/img/spell/${s.image.full}`,
    iconName: s.id,
    isPassive: false,
  }));

  if (c.passive) {
    spells.unshift({
      spellName: c.passive.name,
      iconAsset: `${BASE_URL}/cdn/${v}/img/passive/${c.passive.image.full}`,
      iconName: c.passive.image.full,
      isPassive: true,
    });
  }

  return {
    id: Number(c.key),
    name: c.name,
    key: c.id,
    title: c.title,
    tags: c.tags,
    image: `${BASE_URL}/cdn/${v}/img/champion/${c.image.full}`,
    splashImg: `${BASE_URL}/cdn/img/champion/splash/${c.id}_0.jpg`,
    loadingImg: `${BASE_URL}/cdn/img/champion/loading/${c.id}_0.jpg`,
    squareImg: `${BASE_URL}/cdn/${v}/img/champion/${c.image.full}`,
    spells,
  };
}

export async function fetchItems(version?: string) {
  const v = version ?? (await getLatestVersion());
  const data = await fetchWithTimeout<{ data: Record<string, DDragonItem> }>(
    `${BASE_URL}/cdn/${v}/data/en_US/item.json`,
  );
  return Object.entries(data.data).map(([id, item]) => ({
    id,
    name: item.name,
    description: item.description,
    plaintext: item.plaintext,
    cost: item.gold.total,
    sellValue: item.gold.sell,
    tags: item.tags,
    stats: item.stats,
    image: `${BASE_URL}/cdn/${v}/img/item/${item.image.full}`,
    buildPath: { into: item.into ?? [], from: item.from ?? [] },
  }));
}

export async function fetchSummonerSpells(version?: string) {
  const v = version ?? (await getLatestVersion());
  const data = await fetchWithTimeout<{ data: Record<string, DDragonSummonerSpell> }>(
    `${BASE_URL}/cdn/${v}/data/en_US/summoner.json`,
  );
  return Object.values(data.data).map((s) => ({
    id: Number(s.key),
    key: s.id,
    name: s.name,
    description: s.description,
    image: `${BASE_URL}/cdn/${v}/img/spell/${s.image.full}`,
  }));
}

export async function fetchRunes(version?: string) {
  const v = version ?? (await getLatestVersion());
  const trees = await fetchWithTimeout<DDragonRuneTree[]>(
    `${BASE_URL}/cdn/${v}/data/en_US/runesReforged.json`,
  );
  return {
    trees: trees.map((t) => ({
      id: t.id,
      key: t.key,
      name: t.name,
      icon: `${BASE_URL}/cdn/img/${t.icon}`,
    })),
    keystones: trees.flatMap(
      (t) =>
        t.slots[0]?.runes.map((r) => ({
          id: r.id,
          key: r.key,
          name: r.name,
          icon: `${BASE_URL}/cdn/img/${r.icon}`,
          treeKey: t.key,
          treeName: t.name,
        })) ?? [],
    ),
  };
}

export function getImageUrls(version: string) {
  const cdn = `${BASE_URL}/cdn`;
  return {
    champion: (filename: string) => `${cdn}/${version}/img/champion/${filename}`,
    spell: (filename: string) => `${cdn}/${version}/img/spell/${filename}`,
    item: (filename: string) => `${cdn}/${version}/img/item/${filename}`,
    passive: (filename: string) => `${cdn}/${version}/img/passive/${filename}`,
    profileIcon: (id: number) => `${cdn}/${version}/img/profileicon/${id}.png`,
    splash: (championKey: string, skin = 0) =>
      `${cdn}/img/champion/splash/${championKey}_${skin}.jpg`,
    loading: (championKey: string, skin = 0) =>
      `${cdn}/img/champion/loading/${championKey}_${skin}.jpg`,
  };
}
