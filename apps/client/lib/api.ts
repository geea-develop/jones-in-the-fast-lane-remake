import { GameState, CreateGameRequest, LocationId, ActionId, GameEvent } from "@jones/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://jones-server.onrender.com";

export async function createGame(req: CreateGameRequest): Promise<GameState> {
  const res = await fetch(`${API_URL}/api/game`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  return data.game;
}

export async function loadGame(id: string): Promise<GameState | null> {
  const res = await fetch(`${API_URL}/api/game/${id}`);
  if (res.status === 404) return null;
  const data = await res.json();
  return data.game;
}

export async function moveToLocation(gameId: string, location: LocationId): Promise<{ game: GameState; error?: string }> {
  const res = await fetch(`${API_URL}/api/game/${gameId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location }),
  });
  return res.json();
}

export async function performAction(gameId: string, action: ActionId): Promise<{ game: GameState; message?: string; error?: string }> {
  const res = await fetch(`${API_URL}/api/game/${gameId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return res.json();
}

export async function endWeek(gameId: string): Promise<{ game: GameState; events: GameEvent[] }> {
  const res = await fetch(`${API_URL}/api/game/${gameId}/end-week`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}
