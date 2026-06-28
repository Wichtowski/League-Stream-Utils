const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 250;

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);

export function checkRateLimit(key: string, limit = MAX_REQUESTS): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });

    return true;
  }

  entry.count++;

  return entry.count <= limit;
}

export function getRateLimitHeaders(key: string, limit = MAX_REQUESTS) {
  const entry = store.get(key);
  const remaining = entry ? Math.max(0, limit - entry.count) : limit;
  const reset = entry ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 0;

  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
  };
}
