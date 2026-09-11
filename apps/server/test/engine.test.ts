import assert from "node:assert/strict";
import test from "node:test";
import { GameState, TIME_UNITS_PER_WEEK, checkWin, performAction } from "@jones/shared";

function makeGame(): GameState {
  const player = {
    id: "player",
    name: "Player",
    money: 100,
    education: 0,
    career: 0,
    happiness: 50,
    energy: 100,
    food: 80,
    timeUnits: TIME_UNITS_PER_WEEK,
    position: "workplace" as const,
    job: null,
    turnsEmployed: 0,
  };

  return {
    id: "game",
    player,
    aiJones: { ...player, id: "jones", name: "Jones" },
    week: 1,
    goals: { money: 500, education: 60, career: 60, happiness: 60 },
    goalSelection: { money: true, education: true, career: true, happiness: true, difficulty: "medium" },
    status: "in_progress",
    lastEvent: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

test("rejected work without a job leaves the player state unchanged", () => {
  const game = makeGame();
  const before = structuredClone(game.player);

  const result = performAction(game, "work");

  assert.equal(result.error, "You need a job first! Visit the Employment Office.");
  assert.deepEqual(game.player, before);
});

test("an empty goal selection cannot win the game", () => {
  const game = makeGame();
  game.goalSelection = { money: false, education: false, career: false, happiness: false, difficulty: "medium" };

  assert.equal(checkWin(game, game.player), false);
});

test("finished games reject further actions without changing player state", () => {
  const game = makeGame();
  game.status = "won";
  const before = structuredClone(game.player);

  const result = performAction(game, "work");

  assert.equal(result.error, "This game has already finished");
  assert.deepEqual(game.player, before);
});
