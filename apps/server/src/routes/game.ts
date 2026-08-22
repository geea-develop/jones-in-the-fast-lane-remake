import { Router, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import {
  GameState,
  Player,
  DEFAULT_GOALS,
  DEFAULT_GOAL_SELECTION,
  DIFFICULTY_GOALS,
  TIME_UNITS_PER_WEEK,
  CreateGameRequest,
  MoveRequest,
  ActionRequest,
  GoalSelection,
} from "@jones/shared";
import { saveGame, loadGame } from "../store.js";
import { movePlayer, performAction, endWeek } from "../engine.js";
import { runJonesTurn } from "../ai-jones.js";

export const gameRouter = Router();

function isValidGoalSelection(selection: GoalSelection): boolean {
  const hasGoal = selection.money || selection.education || selection.career || selection.happiness;
  return hasGoal && ["easy", "medium", "hard"].includes(selection.difficulty);
}

function createPlayer(id: string, name: string): Player {
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

// POST / — create new game
gameRouter.post("/", async (req: Request, res: Response) => {
  const { playerName, goalSelection } = req.body as CreateGameRequest;

  const sel: GoalSelection = goalSelection || DEFAULT_GOAL_SELECTION;
  if (!isValidGoalSelection(sel)) {
    res.status(400).json({ error: "Choose at least one goal and a valid difficulty" });
    return;
  }
  const goals = DIFFICULTY_GOALS[sel.difficulty] || DEFAULT_GOALS;

  const gameId = uuid();
  const game: GameState = {
    id: gameId,
    player: createPlayer(uuid(), playerName || "Player"),
    aiJones: createPlayer("jones", "Jones"),
    week: 1,
    goals,
    goalSelection: sel,
    status: "in_progress",
    lastEvent: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveGame(game);
  res.status(201).json({ game });
});

// GET /:id — load game
gameRouter.get("/:id", async (req: Request, res: Response) => {
  const game = await loadGame(req.params.id);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json({ game });
});

// POST /:id/move — move to a location
gameRouter.post("/:id/move", async (req: Request, res: Response) => {
  const game = await loadGame(req.params.id);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const { location } = req.body as MoveRequest;
  if (game.status !== "in_progress") {
    res.status(409).json({ error: "This game has already finished", game });
    return;
  }
  const result = movePlayer(game, location);

  if (result.error) {
    res.status(400).json({ error: result.error, game: result.game });
    return;
  }

  await saveGame(result.game);
  res.json({ game: result.game });
});

// POST /:id/action — perform an action at current location
gameRouter.post("/:id/action", async (req: Request, res: Response) => {
  const game = await loadGame(req.params.id);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const { action } = req.body as ActionRequest;
  if (game.status !== "in_progress") {
    res.status(409).json({ error: "This game has already finished", game });
    return;
  }
  const result = performAction(game, action);

  if (result.error) {
    res.status(400).json({ error: result.error, game: result.game });
    return;
  }

  await saveGame(result.game);
  res.json({ game: result.game, message: result.message });
});

// POST /:id/end-week — end the current week, run AI Jones turn
gameRouter.post("/:id/end-week", async (req: Request, res: Response) => {
  const game = await loadGame(req.params.id);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  if (game.status !== "in_progress") {
    res.status(409).json({ error: "This game has already finished", game, events: [] });
    return;
  }

  // End player's week
  const weekResult = endWeek(game);
  let events = weekResult.events;

  // If game isn't over, run Jones's turn
  if (weekResult.game.status === "in_progress") {
    const jonesResult = runJonesTurn(weekResult.game);
    events = [...events, ...jonesResult.events];
  }

  await saveGame(weekResult.game);
  res.json({ game: weekResult.game, events });
});
