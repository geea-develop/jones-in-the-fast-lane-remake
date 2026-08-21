import { GameState } from "@jones/shared";

// In-memory fallback when Redis is not configured
const memoryStore = new Map<string, GameState>();

let redis: any = null;

async function getRedis() {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({ url, token });
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
    memoryStore.set(game.id, game);
  }
}

export async function loadGame(id: string): Promise<GameState | null> {
  const r = await getRedis();
  if (r) {
    const data = await r.get(`jones:game:${id}`);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data as GameState;
  } else {
    return memoryStore.get(id) || null;
  }
}
