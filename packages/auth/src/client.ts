const CACHE_KEY = 'lsu_auth_cache';
const CACHE_TTL = 5 * 60 * 1000;

interface CachedUser {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
}

interface AuthCache {
  user: CachedUser;
  timestamp: number;
}

export function getCachedUser(): CachedUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: AuthCache = JSON.parse(raw);
    if (Date.now() - cache.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cache.user;
  } catch {
    return null;
  }
}

export function setCachedUser(user: CachedUser) {
  if (typeof window === 'undefined') return;
  const cache: AuthCache = { user, timestamp: Date.now() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function clearCachedUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
}
