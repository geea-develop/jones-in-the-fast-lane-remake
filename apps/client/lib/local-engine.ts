/**
 * Local (offline) game engine adapter.
 *
 * Runs the exact same game logic as the server — imported from `@jones/shared`
 * — entirely in the browser with ZERO network calls. State is persisted to
 * localStorage so an offline game survives a page reload / tab close, which is
 * what makes the game playable as an installed PWA with no internet.
 *
 * The public surface mirrors `lib/api.ts` so it can be swapped in transparently.
 */
import {
  GameState,
  CreateGameRequest,
  LocationId,
  ActionId,
  GameEvent,
  createGame as createGameState,
  movePlayer,
  performAction as performActionEngine,
  endWeek as endWeekEngine,
  runJonesTurn,
} from "@jones/shared";

const STORE_KEY = "jones_offline_games";
// Marks which game ids are offline so lib/api.ts can route them locally.
const INDEX_KEY = "jones_offline_index";
const MAX_SAVED_GAMES = 10;

type GameStore = Record<string, GameState>;

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readStore(): GameStore {
  if (!hasStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as GameStore) : {};
  } catch {
    return {};
  }
}

function pruneStore(store: GameStore, keepId?: string): GameStore {
  const entries = Object.entries(store);
  if (entries.length <= MAX_SAVED_GAMES) return store;

  // Sort by updatedAt descending (newest first)
  entries.sort((a, b) => {
    const timeA = new Date(a[1].updatedAt || 0).getTime();
    const timeB = new Date(b[1].updatedAt || 0).getTime();
    return timeB - timeA;
  });

  const pruned: GameStore = {};
  for (const [id, game] of entries.slice(0, MAX_SAVED_GAMES)) {
    pruned[id] = game;
  }
  if (keepId && store[keepId] && !pruned[keepId]) {
    pruned[keepId] = store[keepId];
  }
  return pruned;
}

function writeStore(store: GameStore): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode — game still works in-memory for this session */
  }
}

function persist(game: GameState): GameState {
  game.updatedAt = new Date().toISOString();
  const store = readStore();
  store[game.id] = game;
  const pruned = pruneStore(store, game.id);
  writeStore(pruned);
  return game;
}

/** True if the given game id belongs to an offline (locally-stored) game. */
export function isOfflineGame(id: string): boolean {
  if (!id) return false;
  return Object.prototype.hasOwnProperty.call(readStore(), id);
}

/** Remember/forget which game the player is currently in offline. */
export function setActiveOfflineGameId(id: string | null): void {
  if (!hasStorage()) return;
  try {
    if (id) window.localStorage.setItem(INDEX_KEY, id);
    else window.localStorage.removeItem(INDEX_KEY);
  } catch {
    /* ignore */
  }
}

export function getActiveOfflineGameId(): string | null {
  if (!hasStorage()) return null;
  try {
    return window.localStorage.getItem(INDEX_KEY);
  } catch {
    return null;
  }
}

// ─── API surface (mirrors lib/api.ts, but 100% local) ────────────────────────

export function createGame(req: CreateGameRequest): GameState {
  const result = createGameState(req);
  if (result.error || !result.game) {
    throw new Error(result.error || "Could not start the game.");
  }
  setActiveOfflineGameId(result.game.id);
  return persist(result.game);
}

export function loadGame(id: string): GameState | null {
  const store = readStore();
  return store[id] ?? null;
}

export function moveToLocation(gameId: string, location: LocationId): { game: GameState; error?: string } {
  const game = loadGame(gameId);
  if (!game) return { game: null as unknown as GameState, error: "Game not found" };
  if (game.status !== "in_progress") {
    return { game, error: "This game has already finished" };
  }
  const result = movePlayer(game, location);
  if (result.error) {
    // Movement failed — don't persist a mutated state (movePlayer only mutates on success).
    return { game: result.game, error: result.error };
  }
  return { game: persist(result.game) };
}

export function performAction(gameId: string, action: ActionId): { game: GameState; message?: string; error?: string } {
  const game = loadGame(gameId);
  if (!game) return { game: null as unknown as GameState, error: "Game not found" };
  if (game.status !== "in_progress") {
    return { game, error: "This game has already finished" };
  }
  const result = performActionEngine(game, action);
  if (result.error) {
    return { game: result.game, error: result.error };
  }
  return { game: persist(result.game), message: result.message };
}

export function endWeek(gameId: string): { game: GameState; events: GameEvent[] } {
  const game = loadGame(gameId);
  if (!game) return { game: null as unknown as GameState, events: [] };
  if (game.status !== "in_progress") {
    return { game, events: [] };
  }

  // End player's week, then (if still in progress) run Jones's turn.
  // Mirrors the server's /end-week orchestration exactly.
  const weekResult = endWeekEngine(game);
  let events = weekResult.events;

  if (weekResult.game.status === "in_progress") {
    const jonesResult = runJonesTurn(weekResult.game);
    events = [...events, ...jonesResult.events];
  }

  return { game: persist(weekResult.game), events };
}
