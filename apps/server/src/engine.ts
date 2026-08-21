import {
  GameState,
  Player,
  LocationId,
  ActionId,
  LOCATIONS,
  ACTIONS,
  TIME_UNITS_PER_WEEK,
  WEEKLY_RENT,
} from "@jones/shared";
import { GameEvent } from "@jones/shared";

// Movement cost: 1 time unit to move to any location (simplified for v1)
const MOVE_COST = 1;

export function movePlayer(game: GameState, location: LocationId): { game: GameState; error?: string } {
  const player = game.player;

  if (player.position === location) {
    return { game, error: "Already at this location" };
  }

  if (player.timeUnits < MOVE_COST) {
    return { game, error: "Not enough time to move" };
  }

  player.timeUnits -= MOVE_COST;
  player.position = location;

  return { game };
}

export function performAction(game: GameState, actionId: ActionId): { game: GameState; error?: string; message?: string } {
  const player = game.player;
  const location = LOCATIONS.find((l) => l.id === player.position);

  if (!location) {
    return { game, error: "Invalid location" };
  }

  if (!location.actions.includes(actionId)) {
    return { game, error: `Cannot perform ${actionId} at ${location.name}` };
  }

  const action = ACTIONS.find((a) => a.id === actionId);
  if (!action) {
    return { game, error: "Unknown action" };
  }

  if (player.timeUnits < action.timeCost) {
    return { game, error: "Not enough time" };
  }

  if (action.moneyCost && player.money < action.moneyCost) {
    return { game, error: "Not enough money" };
  }

  // Deduct costs
  player.timeUnits -= action.timeCost;
  if (action.moneyCost) {
    player.money -= action.moneyCost;
  }

  // Apply effects
  let message = "";
  switch (actionId) {
    case "study":
      const eduGain = 10 + Math.floor(Math.random() * 6); // 10-15
      player.education = Math.min(100, player.education + eduGain);
      message = `Studied hard! Education +${eduGain} (now ${player.education})`;
      break;

    case "browse_jobs": {
      // Auto-assign a job if education is sufficient
      if (player.education >= 40 && (!player.job || player.job.salary < 80)) {
        player.job = { id: "manager", title: "Manager", salary: 80, educationRequired: 40 };
        player.career = Math.min(100, player.career + 20);
        message = "Got a new job: Manager ($80/shift)! Career +20";
      } else if (player.education >= 20 && !player.job) {
        player.job = { id: "clerk", title: "Clerk", salary: 40, educationRequired: 20 };
        player.career = Math.min(100, player.career + 10);
        message = "Got a new job: Clerk ($40/shift)! Career +10";
      } else if (!player.job) {
        player.job = { id: "laborer", title: "Laborer", salary: 20, educationRequired: 0 };
        player.career = Math.min(100, player.career + 5);
        message = "Got a job: Laborer ($20/shift). Career +5";
      } else {
        message = "No better jobs available right now.";
      }
      break;
    }

    case "work":
      if (!player.job) {
        return { game, error: "You need a job first! Visit the Employment Office." };
      }
      player.money += player.job.salary;
      player.career = Math.min(100, player.career + 3);
      player.energy = Math.max(0, player.energy - 15);
      message = `Worked as ${player.job.title}. Earned $${player.job.salary}. Career +3`;
      break;

    case "buy_food":
      player.energy = Math.min(100, player.energy + 30);
      message = "Bought food. Energy +30";
      break;

    case "buy_item":
      // Placeholder — simplified for v1
      if (player.money >= 50) {
        player.money -= 50;
        player.happiness = Math.min(100, player.happiness + 10);
        message = "Bought something nice! Happiness +10 (-$50)";
      } else {
        return { game, error: "Not enough money to buy items (need $50)" };
      }
      break;

    case "pay_rent":
      message = `Paid rent ($${WEEKLY_RENT}).`;
      break;

    case "have_fun":
      const funGain = 15 + Math.floor(Math.random() * 11); // 15-25
      player.happiness = Math.min(100, player.happiness + funGain);
      message = `Had a great time! Happiness +${funGain} (now ${player.happiness})`;
      break;

    case "rest":
      const restGain = 30 + Math.floor(Math.random() * 21); // 30-50
      player.energy = Math.min(100, player.energy + restGain);
      message = `Rested well. Energy +${restGain} (now ${player.energy})`;
      break;
  }

  return { game, message };
}

export function endWeek(game: GameState): { game: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];

  // Deduct rent
  game.player.money -= WEEKLY_RENT;
  events.push({ type: "rent_due", message: `Rent deducted: -$${WEEKLY_RENT}` });

  // Energy decay if didn't rest enough
  game.player.energy = Math.max(0, game.player.energy - 10);

  // Happiness decay
  game.player.happiness = Math.max(0, game.player.happiness - 5);

  // Check for going broke
  if (game.player.money < 0) {
    game.player.money = 0;
    events.push({ type: "fired", message: "You're broke! Scraping by..." });
  }

  // Advance week
  game.week += 1;
  game.player.timeUnits = TIME_UNITS_PER_WEEK;

  events.push({ type: "week_start", message: `Week ${game.week} begins. Time units refreshed.` });

  // Check win condition
  const win = checkWin(game, game.player);
  if (win) {
    game.status = "won";
    events.push({ type: "game_over", message: "🎉 You reached all your goals! You win!" });
  }

  return { game, events };
}

export function checkWin(game: GameState, player: Player): boolean {
  return (
    player.money >= game.goals.money &&
    player.education >= game.goals.education &&
    player.career >= game.goals.career &&
    player.happiness >= game.goals.happiness
  );
}
