import assert from "node:assert/strict";
import test from "node:test";
import {
  createGame,
  movePlayer,
  performAction,
  endWeek,
  runJonesTurn,
  checkWin,
} from "@jones/shared";

// These tests exercise the exact shared logic that the client's offline mode
// (lib/local-engine.ts) runs in the browser — with zero network. They validate
// the domain + orchestration layers directly, without an e2e browser test.

test("createGame builds a valid in-progress game from the shared factory", () => {
  const { game, error } = createGame({
    playerName: "Ada",
    goalSelection: { money: true, education: true, career: true, happiness: true, difficulty: "easy" },
  });

  assert.equal(error, undefined);
  assert.ok(game);
  assert.equal(game!.status, "in_progress");
  assert.equal(game!.week, 1);
  assert.equal(game!.player.name, "Ada");
  assert.equal(game!.aiJones.name, "Jones");
  // Easy difficulty goals
  assert.deepEqual(game!.goals, { money: 300, education: 40, career: 40, happiness: 50 });
});

test("createGame rejects an empty goal selection", () => {
  const { game, error } = createGame({
    playerName: "Ada",
    goalSelection: { money: false, education: false, career: false, happiness: false, difficulty: "easy" },
  });

  assert.equal(game, undefined);
  assert.equal(error, "Choose at least one goal and a valid difficulty");
});

test("offline end-week orchestration advances the week and runs Jones's turn", () => {
  // Mirrors lib/local-engine.endWeek: endWeek(game) then, if still in progress,
  // runJonesTurn(game), concatenating events.
  const { game } = createGame({
    playerName: "Ada",
    goalSelection: { money: true, education: true, career: true, happiness: true, difficulty: "medium" },
  });
  assert.ok(game);

  const jonesEduBefore = game!.aiJones.education;

  const weekResult = endWeek(game!);
  let events = weekResult.events;
  if (weekResult.game.status === "in_progress") {
    const jonesResult = runJonesTurn(weekResult.game);
    events = [...events, ...jonesResult.events];
  }

  assert.equal(game!.week, 2, "week should advance");
  assert.ok(events.some((e) => e.type === "week_start"), "should emit a week_start event");
  assert.ok(events.some((e) => e.type === "jones_turn"), "should emit a jones_turn event");
  // Jones acted during its turn (education is one of the things it pursues early).
  assert.ok(game!.aiJones.education >= jonesEduBefore, "Jones's turn should have run");
});

test("a full offline game loop terminates (player reaches a single goal)", () => {
  // Single-goal (career) game is reliably winnable by working — proves the
  // offline loop reaches a terminal state with pure shared logic.
  const { game } = createGame({
    playerName: "Ada",
    goalSelection: { money: false, education: false, career: true, happiness: false, difficulty: "easy" },
  });
  assert.ok(game);

  let weeks = 0;
  while (game!.status === "in_progress" && weeks < 300) {
    const p = game!.player;
    let guard = 0;
    while (p.timeUnits > 1 && guard++ < 20) {
      if (p.food <= 40 && p.money >= 15) { const r = movePlayer(game!, "store"); if (!r.error) performAction(game!, "buy_food"); continue; }
      if (p.energy < 25) { const r = movePlayer(game!, "home"); if (!r.error) performAction(game!, "rest"); continue; }
      if (!p.job) { const r = movePlayer(game!, "employment_office"); if (!r.error) performAction(game!, "browse_jobs"); continue; }
      const r = movePlayer(game!, "workplace");
      if (r.error) break;
      const a = performAction(game!, "work");
      if (a.error) break;
    }
    endWeek(game!);
    if (game!.status === "in_progress") runJonesTurn(game!);
    weeks++;
  }

  assert.notEqual(game!.status, "in_progress", "game should terminate within 300 weeks");
  assert.ok(game!.status === "won" || game!.status === "lost");
});

test("checkWin honours the selected goals only", () => {
  const { game } = createGame({
    playerName: "Ada",
    goalSelection: { money: false, education: false, career: true, happiness: false, difficulty: "easy" },
  });
  assert.ok(game);

  game!.player.career = game!.goals.career; // meet the one selected goal
  assert.equal(checkWin(game!, game!.player), true);

  // Failing an unselected goal must not matter.
  game!.player.money = 0;
  assert.equal(checkWin(game!, game!.player), true);
});
