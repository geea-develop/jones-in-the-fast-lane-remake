import assert from "node:assert/strict";
import test from "node:test";
import {
  createGame,
  movePlayer,
  performAction,
  endWeek,
  WEEKLY_RENT,
  BANK_TRANSFER_AMOUNT,
  GameState,
} from "@jones/shared";

function newGame(): GameState {
  const { game } = createGame({
    playerName: "Ada",
    goalSelection: { money: true, education: true, career: true, happiness: true, difficulty: "easy" },
  });
  assert.ok(game);
  return game!;
}

test("pay_rent does not double-charge: manual payment skips the end-week deduction", () => {
  const game = newGame();
  const startMoney = game.player.money;

  // Pay rent manually at the Rent Office.
  const moved = movePlayer(game, "rent_office");
  assert.equal(moved.error, undefined);
  const paid = performAction(game, "pay_rent");
  assert.equal(paid.error, undefined);
  assert.equal(game.player.rentPaidThisWeek, true);
  assert.equal(game.player.money, startMoney - WEEKLY_RENT, "manual payment costs one week's rent");

  const { events } = endWeek(game);

  // End-week must NOT deduct rent again. Assert on the deterministic rent_due
  // event rather than the money total, which random events can also change.
  const rentEvent = events.find((e) => e.type === "rent_due");
  assert.ok(rentEvent, "a rent_due event should be emitted");
  assert.match(rentEvent!.message, /already paid/i, "rent must not be charged twice in the same week");
  // Flag resets for the new week.
  assert.equal(game.player.rentPaidThisWeek, false, "rent flag resets after the week advances");
});

test("without manual payment, rent is deducted once at end of week", () => {
  const game = newGame();

  const { events } = endWeek(game);

  // Assert on the rent_due event (deterministic) rather than the money total,
  // which random events (mugging, found money, etc.) can also affect.
  const rentEvent = events.find((e) => e.type === "rent_due");
  assert.ok(rentEvent, "a rent_due event should be emitted");
  assert.equal(rentEvent!.message, `Rent deducted: -$${WEEKLY_RENT}`, "rent deducted once automatically");
});

test("paying rent twice in one week is rejected (no wasted money)", () => {
  const game = newGame();
  movePlayer(game, "rent_office");
  performAction(game, "pay_rent");
  const moneyAfterFirst = game.player.money;

  const second = performAction(game, "pay_rent");
  assert.equal(second.error, "Rent is already paid for this week.");
  assert.equal(game.player.money, moneyAfterFirst, "second payment must not charge again");
});

test("bank deposit moves cash into a protected balance; withdraw returns it", () => {
  const game = newGame();
  const startMoney = game.player.money;

  movePlayer(game, "bank");
  const dep = performAction(game, "deposit");
  assert.equal(dep.error, undefined);
  assert.equal(game.player.bankBalance, BANK_TRANSFER_AMOUNT);
  assert.equal(game.player.money, startMoney - BANK_TRANSFER_AMOUNT);

  const wd = performAction(game, "withdraw");
  assert.equal(wd.error, undefined);
  assert.equal(game.player.bankBalance, 0);
  assert.equal(game.player.money, startMoney, "money returns to cash after withdraw");
});

test("deposit is rejected without enough cash; withdraw rejected on empty account", () => {
  const game = newGame();
  game.player.money = BANK_TRANSFER_AMOUNT - 1;

  movePlayer(game, "bank");
  const dep = performAction(game, "deposit");
  assert.ok(dep.error, "deposit should be rejected below the transfer amount");
  assert.equal(game.player.bankBalance, 0);

  const wd = performAction(game, "withdraw");
  assert.equal(wd.error, "Your bank account is empty.");
});

test("banked money is safe from muggings (only cash on hand is at risk)", () => {
  const game = newGame();
  // Put money in the bank, leave a little cash.
  game.player.money = 200;
  movePlayer(game, "bank");
  performAction(game, "deposit"); // bank = 50, cash = 150
  const bankedBefore = game.player.bankBalance;
  assert.equal(bankedBefore, BANK_TRANSFER_AMOUNT);

  // Simulate the worst-case mugging directly against the engine's rule: muggings
  // reduce p.money only. Bank balance must be untouched regardless of the roll.
  // Run many end-weeks to make a mugging overwhelmingly likely, then assert the
  // bank balance never dropped.
  for (let i = 0; i < 50 && game.status === "in_progress"; i++) {
    // Keep the player alive/solvent so the loop can continue mugging attempts.
    game.player.food = 100;
    game.player.energy = 100;
    game.player.money += 100; // fresh cash to be muggable
    endWeek(game);
    assert.ok(game.player.bankBalance >= bankedBefore, "bank balance must never be reduced by a mugging");
  }
});
