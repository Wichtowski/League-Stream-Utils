import { getChampionById } from '@lib/champions';

// Cache user data path for asset-cache resolution
let userDataPathCache: string | null = null;
if (typeof window !== 'undefined' && window.electronAPI?.getUserDataPath) {
    window.electronAPI
        .getUserDataPath()
        .then((p) => {
            userDataPathCache = p;
        })
        .catch(() => {
            userDataPathCache = null;
        });
}

const resolveCachedPath = (relativePath: string): string => {
    if (typeof window !== 'undefined' && window.electronAPI?.getUserDataPath) {
        if (userDataPathCache) {
            const base = userDataPathCache.replace(/\\/g, '/');
            const rel = relativePath.replace(/\\/g, '/');
            return `file://${base}/assets/${rel}`;
        }
    }
    // Fallback for browser: use API route
    return `/api/local-image?path=${encodeURIComponent(relativePath)}`;
};

export const getChampionLoadingImage = (championId: number): string | null => {
    if (!championId) return null;
    const champ = getChampionById(championId);
    if (!champ?.image) return null;

    // Resolve cached relative path (starts with 'cache/')
    if (champ.image.startsWith('cache/')) {
        return resolveCachedPath(champ.image);
    }

    // Convert DataDragon URL to asset-cache path if possible
    const ddragonMatch = champ.image.match(/\/cdn\/([^/]+)\/img\/champion\/([^.]+)\.png$/);
    if (ddragonMatch) {
        const [, version, key] = ddragonMatch;
        const rel = `cache/game/${version}/champions/${key}/loading.jpg`;
        return resolveCachedPath(rel);
    }

    // If already an http/https url return directly (fallback)
    if (/^https?:\/\//.test(champ.image)) return champ.image;

    // Final fallback
    return champ.image;
};

export const getChampionSquareImage = (championId: number): string | null => {
    if (!championId) return null;
    const champ = getChampionById(championId);
    if (!champ?.image) return null;

    // Resolve cached relative path (starts with 'cache/')
    if (champ.image.startsWith('cache/')) {
        return resolveCachedPath(champ.image);
    }

    // Convert DataDragon URL to asset-cache path if possible
    const ddragonMatch = champ.image.match(/\/cdn\/([^/]+)\/img\/champion\/([^.]+)\.png$/);
    if (ddragonMatch) {
        const [, version, key] = ddragonMatch;
        const rel = `cache/game/${version}/champions/${key}/square.png`;
        return resolveCachedPath(rel);
    }

    // If already an http/https url return directly (fallback)
    if (/^https?:\/\//.test(champ.image)) return champ.image;

    // Final fallback
    return champ.image;
};

export const getChampionCenteredSplashImage = (championId: number): string | null => {
    if (!championId) return null;
    const champ = getChampionById(championId);
    if (!champ?.image) return null;

    // Resolve cached relative path (starts with 'cache/')
    if (champ.image.startsWith('cache/')) {
        return resolveCachedPath(champ.image);
    }

    // Convert DataDragon URL to asset-cache path if possible
    const ddragonMatch = champ.image.match(/\/cdn\/([^/]+)\/img\/champion\/([^.]+)\.png$/);
    if (ddragonMatch) {
        const [, version, key] = ddragonMatch;
        const rel = `cache/game/${version}/champions/${key}/splashCentered.jpg`;
        return resolveCachedPath(rel);
    }

    // If already an http/https url return directly (fallback)
    if (/^https?:\/\//.test(champ.image)) return champ.image;

    // Final fallback
    return champ.image;
};

export const getChampionName = (championId: number): string => {
    if (!championId) return '';
    const champ = getChampionById(championId);
    if (!champ?.name) return `Champion ${championId}`;
    return champ.name;
};
