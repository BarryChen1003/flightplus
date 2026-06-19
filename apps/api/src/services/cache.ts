// In-memory cache (Phase 1) + Upstash Redis (Phase 2)
// When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, uses Upstash
// Otherwise falls back to in-memory cache (development)

export const TTL = {
  FLIGHT_SEARCH: 15 * 60,
  CALENDAR_DATA: 60 * 60,
  STATIC_DATA: 24 * 60 * 60,
  HOTEL_SEARCH: 30 * 60,
} as const;

// ── In-Memory Fallback ──────────────────────────────────────────────────────

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

// ── Upstash Redis Client (lazy async init) ──────────────────────────────────

type UpstashRedis = import('@upstash/redis').Redis;
let redisClient: UpstashRedis | null = null;

async function getRedis(): Promise<UpstashRedis | null> {
  if (redisClient) return redisClient;

  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !restToken) {
    return null;
  }

  try {
    // Dynamic import so build doesn't fail when package is not installed yet
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({ url: restUrl, token: restToken });
    return redisClient;
  } catch {
    return null;
  }
}

// ── Cache Operations ─────────────────────────────────────────────────────────

async function cacheGet(key: string): Promise<string | null> {
  const client = await getRedis();
  if (client) {
    try {
      const val = await client.get<string>(key);
      // Guard against Upstash returning non-string (e.g. deserialized object)
      if (typeof val !== 'string') return null;
      return val;
    } catch (e) {
      console.warn('[cache] Redis GET failed, falling back to memory:', e);
    }
  }
  return memGet(key);
}

async function cacheSet(key: string, value: string, ttl: number): Promise<void> {
  const client = await getRedis();
  if (client) {
    try {
      await client.set(key, value, { ex: ttl });
      return;
    } catch (e) {
      console.warn('[cache] Redis SET failed, falling back to memory:', e);
    }
  }
  memSet(key, value, ttl);
}

// ── Key Builders ─────────────────────────────────────────────────────────────

export function buildFlightKey(origin: string, destination: string, date: string): string {
  return `flight:${origin}:${destination}:${date}`;
}

export function buildStaticDataKey(type: string, lang: string): string {
  return `static:${type}:${lang}`;
}

// ── Init ─────────────────────────────────────────────────────────────────────

export function initCache(_redisUrl?: string): void {
  const hasUpstash = !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
  console.log(
    hasUpstash
      ? '[Cache] Phase 2 — Upstash Redis connected'
      : '[Cache] Phase 1 — in-memory cache active (Upstash in Phase 2)'
  );
}

// ── High-Level API ───────────────────────────────────────────────────────────

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

export async function getCachedStaticData(
  type: string,
  lang = 'zh'
): Promise<string | null> {
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