import { getChampionById, getChampionByName, getChampionByKey } from "@lib/champions";
import { getSummonerSpellById, getSummonerSpellsCached } from "@lib/summoner-spells";

// Cache user data path for asset-cache resolution
let userDataPathCache: string | null = null;
if (typeof window !== "undefined" && window.electronAPI?.getUserDataPath) {
  window.electronAPI
    .getUserDataPath()
    .then((p) => {
      userDataPathCache = p;
    })
    .catch(() => {
      userDataPathCache = null;
    });
}

export const getSummonerSpellImageByName = (summonerSpellName: string): string => {
  // Trim all spaces and add "Summoner" prefix
  const original = (summonerSpellName || "").trim();
  if (!original) return "";
  const normalizedName = `Summoner${original.replace(/\s+/g, "")}`;

  // Get the spell from memory cache
  const spell = getSummonerSpellById(normalizedName);

  if (spell && spell.image) {
    // If it already points to our API, use it
    if (spell.image.startsWith("/api/local-image")) return spell.image;
    // If it's a cached/asset relative path, resolve via API
    if (spell.image.startsWith("assets/")) {
      return `/api/local-image?path=${encodeURIComponent(spell.image.replace(/^cache\//, ""))}`;
    }
    // If it's an http/https URL, return as-is
    if (/^https?:\/\//.test(spell.image)) return spell.image;
    return spell.image;
  }

  // Fallback: match by display name
  const all = getSummonerSpellsCached();
  const byName = all.find((s) => s.name.toLowerCase() === original.toLowerCase());
  if (byName?.image) {
    if (byName.image.startsWith("/api/local-image")) return byName.image;
    if (byName.image.startsWith("assets/")) {
      return `/api/local-image?path=${encodeURIComponent(byName.image.replace(/^cache\//, ""))}`;
    }
    if (/^https?:\/\//.test(byName.image)) return byName.image;
    return byName.image;
  }

  // If no spell found, return default image
  return "";
};

const resolveCachedPath = (relativePath: string): string => {
  if (typeof window !== "undefined" && window.electronAPI?.getUserDataPath) {
    if (userDataPathCache) {
      const base = userDataPathCache.replace(/\\/g, "/");
      const rel = relativePath.replace(/\\/g, "/");
      return `file://${base}/assets/${rel}`;
    }
  }
  // Fallback for browser: use API route
  return `/api/local-image?path=${encodeURIComponent(relativePath)}`;
};

export const getChampionLoadingImage = (championId: number | string): string | null => {
  if (!championId) return null;

  let champ;
  if (typeof championId === "number") {
    champ = getChampionById(championId);
  } else {
    // Try to find by name first, then by key
    champ = getChampionByName(championId) || getChampionByKey(championId);
  }

  if (!champ?.image) return null;

  // Resolve cached relative path (starts with 'cache/')
  if (champ.image.startsWith("hosted/assets/")) {
    return resolveCachedPath(champ.image);
  }

  // Convert DataDragon URL to asset-cache path if possible
  const ddragonMatch = champ.image.match(/\/cdn\/([^/]+)\/img\/champion\/([^.]+)\.png$/);
  if (ddragonMatch) {
    const [, version, key] = ddragonMatch;
    const rel = `hosted/assets/${version}/champion/${key}/loading.png`;
    return resolveCachedPath(rel);
  }

  // If already an http/https url return directly (fallback)
  if (/^https?:\/\//.test(champ.image)) return champ.image;

  // Final fallback
  return champ.image;
};

export const getChampionSquareImage = (championId: number | string): string => {
  if (!championId) return "";

  let champ;
  if (typeof championId === "number") {
    champ = getChampionById(championId);
  } else {
    // Try to find by name first, then by key
    champ = getChampionByName(championId) || getChampionByKey(championId);
  }

  if (!champ?.image) return "";

  // Resolve cached relative path (starts with 'cache/')
  if (champ.image.startsWith("hosted/assets/")) {
    return resolveCachedPath(champ.image);
  }

  // Convert DataDragon URL to asset-cache path if possible
  const ddragonMatch = champ.image.match(/\/cdn\/([^/]+)\/img\/champion\/([^.]+)\.png$/);
  if (ddragonMatch) {
    const [, version, key] = ddragonMatch;
    const rel = `assets/${version}/champions/${key}/square.png`;
    return resolveCachedPath(rel);
  }

  // If already an http/https url return directly (fallback)
  if (/^https?:\/\//.test(champ.image)) return champ.image;

  // Final fallback
  return champ.image;
};

export const getChampionCenteredSplashImage = (championId: number | string): string => {
  if (!championId) return "";

  let champ;
  if (typeof championId === "number") {
    champ = getChampionById(championId);
  } else {
    // Try to find by name first, then by key
    champ = getChampionByName(championId) || getChampionByKey(championId);
  }

  if (!champ) return "";

  // Use splashCenteredImg if available
  if (champ.splashCenteredImg) {
    // Handle different path formats
    if (champ.splashCenteredImg.startsWith("cache/")) {
      return resolveCachedPath(champ.splashCenteredImg);
    }
    if (champ.splashCenteredImg.startsWith("assets/")) {
      return `/api/local-image?path=${encodeURIComponent(champ.splashCenteredImg)}`;
    }
    if (/^https?:\/\//.test(champ.splashCenteredImg)) {
      return champ.splashCenteredImg;
    }
    return champ.splashCenteredImg;
  }

  // Fallback: convert square image to splash centered
  if (!champ.image) return "";

  // Handle different path formats for the main image
  if (champ.image.startsWith("cache/")) {
    return resolveCachedPath(champ.image);
  }
  if (champ.image.startsWith("assets/")) {
    return `/api/local-image?path=${encodeURIComponent(champ.image)}`;
  }

  // Convert DataDragon URL to asset-cache path if possible
  const ddragonMatch = champ.image.match(/\/cdn\/([^/]+)\/img\/champion\/([^.]+)\.png$/);
  if (ddragonMatch) {
    const [, version, key] = ddragonMatch;
    const rel = `assets/${version}/champions/${key}/splashCentered.jpg`;
    return resolveCachedPath(rel);
  }

  // Convert local asset paths to splash centered
  const localMatch = champ.image.match(/\/api\/local-image\?path=assets%2F([^%]+)%2Fchampions%2F([^%]+)%2Fsquare\.png/);
  if (localMatch) {
    const [, version, key] = localMatch;
    return `/api/local-image?path=${encodeURIComponent(`assets/${version}/champions/${key}/splashCentered.jpg`)}`;
  }

  // Convert direct asset paths to splash centered
  const assetMatch = champ.image.match(/assets\/([^/]+)\/champions\/([^/]+)\/square\.png/);
  if (assetMatch) {
    const [, version, key] = assetMatch;
    return `/api/local-image?path=${encodeURIComponent(`assets/${version}/champions/${key}/splashCentered.jpg`)}`;
  }

  // If it's already a centered splash image, return as is
  if (champ.image.includes("splashCentered.jpg")) {
    return resolveCachedPath(champ.image);
  }

  // If already an http/https url return directly (fallback)
  if (/^https?:\/\//.test(champ.image)) return champ.image;

  // Final fallback
  return champ.image;
};

export const getChampionName = (championId: number): string => {
  if (!championId) return "";
  const champ = getChampionById(championId);
  if (!champ?.name) return `Champion ${championId}`;
  return champ.name;
};

export const getOverlayAsset = (version: string, asset: string): string => {
  return getAsset(version, "overlay", asset);
};

export const getDefaultAsset = (version: string, asset: string): string => {
  return getAsset(version, "default", asset);
};

type DragonPitAsset =
  | "chemtech.png"
  | "cloud.png"
  | "elder.png"
  | "hextech.png"
  | "infernal.png"
  | "mountain.png"
  | "ocean.png";
export const getDragonPitAsset = (version: string, asset: DragonPitAsset): string => {
  return getAsset(version, "dragonpit", asset);
};

type BaronPitAsset = "baron.png" | "grubs.png" | "herald.png";
export const getBaronPitAsset = (version: string, asset: BaronPitAsset): string => {
  return getAsset(version, "baronpit", asset);
};

type AtakhanAsset = "atakhan_ruinous.png" | "atakhan_voracious.png";
export const getAtakhanAsset = (version: string, asset: AtakhanAsset): string => {
  return getAsset(version, "atakhan", asset);
};

type CommonAsset = "tower.png" | "crossed_swords.png" | "crossed_swords_gray.png" | "turret.png" | "turret_gray.png";
export const getCommonAsset = (version: string, asset: CommonAsset): string => {
  return getAsset(version, "common", asset);
};

type ScoreboardAsset = "gold.png" | "tower.png" | "grubs.png";
export const getScoreboardAsset = (version: string, asset: ScoreboardAsset): string => {
  return getAsset(version, "scoreboard", asset);
};

type RoleIconAsset =
  | "top_splash_placeholder.svg"
  | "jung_splash_placeholder.svg"
  | "mid_splash_placeholder.svg"
  | "sup_splash_placeholder.svg"
  | "bot_splash_placeholder.svg";
export const getRoleIconAsset = (version: string, asset: RoleIconAsset): string => {
  return getAsset(version, "role", asset);
};

export const getAllRoleIconAssets = (version: string): { [key: string]: string } => {
  return {
    TOP: getAsset(version, "roleIcons", "top_splash_placeholder.svg"),
    JUNGLE: getAsset(version, "roleIcons", "jung_splash_placeholder.svg"),
    MID: getAsset(version, "roleIcons", "mid_splash_placeholder.svg"),
    SUPPORT: getAsset(version, "roleIcons", "sup_splash_placeholder.svg"),
    BOTTOM: getAsset(version, "roleIcons", "bot_splash_placeholder.svg")
  };
};

const getAsset = (version: string, type: string, asset: string): string => {
  console.log(`assets/${version}/${type}/${asset}`);
  return `/api/local-image?path=${encodeURIComponent(`assets/${version}/overlay/${type}/${asset}`)}`;
};
