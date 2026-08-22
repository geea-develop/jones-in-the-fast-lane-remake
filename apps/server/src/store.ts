import { GameState } from "@jones/shared";

// In-memory fallback when Redis is not configured. Keep the fallback bounded too:
// otherwise abandoned game IDs would accumulate for the lifetime of the process.
const MEMORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MEMORY_MAX_GAMES = 1000;
const memoryStore = new Map<string, { game: GameState; expiresAt: number; touchedAt: number }>();

function pruneMemoryStore(now = Date.now()): void {
  for (const [id, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(id);
  }

  while (memoryStore.size > MEMORY_MAX_GAMES) {
    const oldest = [...memoryStore.entries()].sort((a, b) => a[1].touchedAt - b[1].touchedAt)[0];
    if (!oldest) break;
    memoryStore.delete(oldest[0]);
  }
}

interface RedisClient {
  set(key: string, value: string, options: { ex: number }): Promise<unknown>;
  get<T = unknown>(key: string): Promise<T | null>;
}

let redis: RedisClient | null = null;

async function getRedis() {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({ url, token }) as RedisClient;
    return redis;
  }

  return null;
}

export async function saveGame(game: GameState): Promise<void> {
  game.updatedAt = new Date().toISOString();
  const r = await getRedis();
  if (r) {
    await r.set(`jones:game:${game.id}`, JSON.stringify(game), { ex: 60 * 60 * 24 * 7 }); // 7 day TTL
  } else {
    const now = Date.now();
    pruneMemoryStore(now);
    memoryStore.set(game.id, { game, expiresAt: now + MEMORY_TTL_MS, touchedAt: now });
    pruneMemoryStore(now);
  }
}

export async function loadGame(id: string): Promise<GameState | null> {
  const r = await getRedis();
  if (r) {
    const data = await r.get(`jones:game:${id}`);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data as GameState;
  } else {
    pruneMemoryStore();
    const entry = memoryStore.get(id);
    if (!entry) return null;
    entry.touchedAt = Date.now();
    return entry.game;
  }
}
