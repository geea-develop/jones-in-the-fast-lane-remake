import { v4 as uuid } from "uuid";
import {
  GameState,
  Player,
  GoalSelection,
  DEFAULT_GOALS,
  DEFAULT_GOAL_SELECTION,
  DIFFICULTY_GOALS,
  TIME_UNITS_PER_WEEK,
} from "./game.js";
import { CreateGameRequest } from "./api.js";

export function isValidGoalSelection(selection: GoalSelection): boolean {
  const hasGoal = selection.money || selection.education || selection.career || selection.happiness;
  return hasGoal && ["easy", "medium", "hard"].includes(selection.difficulty);
}

export function createPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    money: 100,
    education: 0,
    career: 0,
    happiness: 50,
    energy: 100,
    food: 80,
    timeUnits: TIME_UNITS_PER_WEEK,
    position: "home",
    job: null,
    turnsEmployed: 0,
  };
}

/**
 * Create a fresh game. Shared between the server (REST) and the client
 * (offline mode) so both build byte-identical initial state.
 *
 * Returns `{ error }` if the goal selection is invalid so callers can map it
 * to their transport (HTTP 400 on the server, thrown Error on the client).
 */
export function createGame(req: CreateGameRequest): { game?: GameState; error?: string } {
  const sel: GoalSelection = req.goalSelection || DEFAULT_GOAL_SELECTION;
  if (!isValidGoalSelection(sel)) {
    return { error: "Choose at least one goal and a valid difficulty" };
  }
  const goals = DIFFICULTY_GOALS[sel.difficulty] || DEFAULT_GOALS;

  const now = new Date().toISOString();
  const game: GameState = {
    id: uuid(),
    player: createPlayer(uuid(), req.playerName || "Player"),
    aiJones: createPlayer("jones", "Jones"),
    week: 1,
    goals,
    goalSelection: sel,
    status: "in_progress",
    lastEvent: null,
    createdAt: now,
    updatedAt: now,
  };

  return { game };
}
