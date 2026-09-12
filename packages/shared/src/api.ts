import { GameState, GoalSelection } from "./game.js";
import { ActionId, LocationId } from "./locations.js";

// POST /api/game — create new game
export interface CreateGameRequest {
  playerName: string;
  goalSelection?: GoalSelection;
}

export interface CreateGameResponse {
  game: GameState;
}

// GET /api/game/:id — load game
export interface LoadGameResponse {
  game: GameState;
}

// POST /api/game/:id/move — move to location
export interface MoveRequest {
  location: LocationId;
}

// POST /api/game/:id/action — perform action
export interface ActionRequest {
  action: ActionId;
}

// POST /api/game/:id/end-week — end current week
export interface EndWeekResponse {
  game: GameState;
  events: GameEvent[];
}

export interface GameEvent {
  type: "rent_due" | "fired" | "promotion" | "week_start" | "goal_reached" | "game_over" | "death" | "hunger" | "random_event" | "starving" | "jones_turn" | "bank_interest";
  message: string;
}
