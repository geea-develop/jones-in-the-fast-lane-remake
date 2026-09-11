import { GameState, CreateGameRequest, LocationId, ActionId, GameEvent } from "@jones/shared";
import * as local from "./local-engine";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Offline single-player mode.
 *
 * When a game is created with `offline: true`, it runs entirely in the browser
 * via `lib/local-engine` (shared engine + AI Jones) with no network calls, and
 * persists to localStorage. Subsequent move/action/end-week calls detect the
 * offline game by id and route to the local engine. Online games keep using the
 * REST server exactly as before.
 */
type CreateGameLocalRequest = CreateGameRequest & { offline?: boolean };

function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function createGame(req: CreateGameLocalRequest): Promise<GameState> {
  if (req.offline) {
    // Runs locally, no network.
    return local.createGame({ playerName: req.playerName, goalSelection: req.goalSelection });
  }

  // Starting an online game — clear any active offline game ID so auto-resume won't prefer it
  local.setActiveOfflineGameId(null);

  const res = await fetchWithTimeout(`${API_URL}/api/game`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName: req.playerName, goalSelection: req.goalSelection }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.game) {
    throw new Error(data.error || `Could not start the game (HTTP ${res.status}).`);
  }
  return data.game;
}

export async function loadGame(id: string): Promise<GameState | null> {
  // Offline games live only in the browser — never hit the network for them.
  if (local.isOfflineGame(id)) {
    return local.loadGame(id);
  }
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/game/${id}`);
    if (res.status === 404) return null;
    const data = await res.json();
    return data.game;
  } catch {
    return null;
  }
}

export async function moveToLocation(gameId: string, location: LocationId): Promise<{ game: GameState; error?: string }> {
  if (local.isOfflineGame(gameId)) {
    return local.moveToLocation(gameId, location);
  }
  const res = await fetchWithTimeout(`${API_URL}/api/game/${gameId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location }),
  });
  return res.json();
}

export async function performAction(gameId: string, action: ActionId): Promise<{ game: GameState; message?: string; error?: string }> {
  if (local.isOfflineGame(gameId)) {
    return local.performAction(gameId, action);
  }
  const res = await fetchWithTimeout(`${API_URL}/api/game/${gameId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return res.json();
}

export async function endWeek(gameId: string): Promise<{ game: GameState; events: GameEvent[] }> {
  if (local.isOfflineGame(gameId)) {
    return local.endWeek(gameId);
  }
  const res = await fetchWithTimeout(`${API_URL}/api/game/${gameId}/end-week`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}
