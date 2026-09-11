import { Router, Request, Response } from "express";
import {
  CreateGameRequest,
  MoveRequest,
  ActionRequest,
  movePlayer,
  performAction,
  endWeek,
  runJonesTurn,
  createGame,
} from "@jones/shared";
import { saveGame, loadGame } from "../store.js";

export const gameRouter = Router();

// POST / — create new game
gameRouter.post("/", async (req: Request, res: Response) => {
  const { playerName, goalSelection } = req.body as CreateGameRequest;

  const result = createGame({ playerName, goalSelection });
  if (result.error || !result.game) {
    res.status(400).json({ error: result.error ?? "Invalid game configuration" });
    return;
  }
  const game = result.game;

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
