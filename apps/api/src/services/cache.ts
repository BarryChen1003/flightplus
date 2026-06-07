// In-memory cache (Phase 1)
// Redis support will be added in Phase 2 via Upstash

export const TTL = {
  FLIGHT_SEARCH: 15 * 60,
  CALENDAR_DATA: 60 * 60,
  STATIC_DATA: 24 * 60 * 60,
  HOTEL_SEARCH: 30 * 60,
} as const;

const memCache = new Map<string, { value: string; expiry: number }>();

function memGet(key: string): string | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    memCache.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key: string, value: string, ttl: number): void {
  memCache.set(key, { value, expiry: Date.now() + ttl * 1000 });
}

async function cacheGet(key: string): Promise<string | null> {
  return memGet(key);
}

async function cacheSet(key: string, value: string, ttl: number): Promise<void> {
  memSet(key, value, ttl);
}

export function buildFlightKey(origin: string, destination: string, date: string): string {
  return `flight:${origin}:${destination}:${date}`;
}

export function buildStaticDataKey(type: string, lang: string): string {
  return `static:${type}:${lang}`;
}

export function initCache(_redisUrl?: string): void {
  console.log('[Cache] Phase 1 — in-memory cache active (Redis in Phase 2)');
}

export async function getCachedFlightSearch(
  origin: string,
  destination: string,
  date: string
): Promise<{ data: string; cachedAt: string } | null> {
  const key = buildFlightKey(origin, destination, date);
  const data = await cacheGet(key);
  if (!data) return null;

  let cachedAt: string;
  try {
    const parsed = JSON.parse(data);
    cachedAt = parsed._cachedAt ?? new Date().toISOString();
  } catch {
    cachedAt = new Date().toISOString();
  }
  return { data, cachedAt };
}

export async function setCachedFlightSearch(
  origin: string,
  destination: string,
  date: string,
  payload: object
): Promise<void> {
  const key = buildFlightKey(origin, destination, date);
  const withTimestamp = { ...payload, _cachedAt: new Date().toISOString() };
  await cacheSet(key, JSON.stringify(withTimestamp), TTL.FLIGHT_SEARCH);
}

export async function getCachedStaticData(type: string, lang = 'zh'): Promise<string | null> {
  const key = buildStaticDataKey(type, lang);
  return cacheGet(key);
}

export async function setCachedStaticData(
  type: string,
  lang: string,
  payload: object
): Promise<void> {
  const key = buildStaticDataKey(type, lang);
  await cacheSet(key, JSON.stringify(payload), TTL.STATIC_DATA);
}