import {
  LocationId,
  ActionId,
  LOCATIONS,
  ACTIONS,
  getMovementCost,
} from "./locations.js";
import {
  GameState,
  Player,
  JOBS,
  TIME_UNITS_PER_WEEK,
  WEEKLY_RENT,
  FOOD_DECAY_PER_WEEK,
  HUNGER_ENERGY_PENALTY,
  LOW_ENERGY_FIRE_THRESHOLD,
} from "./game.js";
import { GameEvent } from "./api.js";

export function movePlayer(game: GameState, location: LocationId): { game: GameState; error?: string } {
  if (game.status !== "in_progress") {
    return { game, error: "This game has already finished" };
  }

  const player = game.player;

  if (player.position === location) {
    return { game, error: "Already at this location" };
  }

  const cost = getMovementCost(player.position, location);

  if (player.timeUnits < cost) {
    return { game, error: `Not enough time to move (need ${cost}, have ${player.timeUnits})` };
  }

  player.timeUnits -= cost;
  player.position = location;

  return { game };
}

export function performAction(game: GameState, actionId: ActionId): { game: GameState; error?: string; message?: string } {
  if (game.status !== "in_progress") {
    return { game, error: "This game has already finished" };
  }

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

  // Validate action-specific requirements before making any state changes.
  if (actionId === "work" && !player.job) {
    return { game, error: "You need a job first! Visit the Employment Office." };
  }

  if (actionId === "work" && player.energy < 15) {
    return { game, error: "Too tired to work effectively. Rest first!" };
  }

  if (player.timeUnits < action.timeCost) {
    return { game, error: "Not enough time" };
  }

  if (action.moneyCost && player.money < action.moneyCost) {
    return { game, error: "Not enough money" };
  }

  // Energy check — can't do much when exhausted
  if (player.energy <= 5 && actionId !== "rest" && actionId !== "buy_food") {
    return { game, error: "Too exhausted! You need to rest or eat." };
  }

  // Deduct costs
  player.timeUnits -= action.timeCost;
  if (action.moneyCost) {
    player.money -= action.moneyCost;
  }

  // Apply effects
  let message = "";
  switch (actionId) {
    case "study": {
      const eduGain = 8 + Math.floor(Math.random() * 8); // 8-15
      player.education = Math.min(100, player.education + eduGain);
      player.energy = Math.max(0, player.energy - 10);
      message = `Studied hard! Education +${eduGain} (now ${player.education})`;
      break;
    }

    case "browse_jobs": {
      // Find best job player qualifies for that's better than current
      const available = JOBS.filter((j) => player.education >= j.educationRequired);
      const bestAvailable = available[available.length - 1];

      if (bestAvailable && (!player.job || bestAvailable.salary > player.job.salary)) {
        player.job = bestAvailable;
        player.career = Math.min(100, player.career + bestAvailable.careerGain);
        player.turnsEmployed = 0;
        message = `Got a new job: ${bestAvailable.title} ($${bestAvailable.salary}/shift)! Career +${bestAvailable.careerGain}`;
      } else if (player.job) {
        message = `No better jobs available. Current: ${player.job.title} ($${player.job.salary}/shift)`;
      } else {
        // Everyone can at least get dishwasher
        player.job = JOBS[0];
        player.career = Math.min(100, player.career + JOBS[0].careerGain);
        player.turnsEmployed = 0;
        message = `Got a job: ${JOBS[0].title} ($${JOBS[0].salary}/shift)`;
      }
      break;
    }

    case "work": {
      // Preconditions were checked before costs were deducted.
      const job = player.job!;
      player.money += job.salary;
      player.career = Math.min(100, player.career + job.careerGain);
      player.energy = Math.max(0, player.energy - 20);
      player.turnsEmployed += 1;
      message = `Worked as ${job.title}. Earned $${job.salary}. Career +${job.careerGain}`;
      break;
    }

    case "buy_food": {
      player.food = Math.min(100, player.food + 40);
      message = `Bought groceries. Food +40 (now ${player.food})`;
      break;
    }

    case "buy_item": {
      player.happiness = Math.min(100, player.happiness + 10);
      message = "Bought something nice! Happiness +10";
      break;
    }

    case "pay_rent": {
      message = `Paid rent ($${WEEKLY_RENT}).`;
      break;
    }

    case "have_fun": {
      const funGain = 15 + Math.floor(Math.random() * 11); // 15-25
      player.happiness = Math.min(100, player.happiness + funGain);
      player.energy = Math.max(0, player.energy - 5);
      message = `Had a great time! Happiness +${funGain} (now ${player.happiness})`;
      break;
    }

    case "rest": {
      const restGain = 30 + Math.floor(Math.random() * 21); // 30-50
      player.energy = Math.min(100, player.energy + restGain);
      player.happiness = Math.max(0, player.happiness - 3); // resting is boring
      message = `Rested well. Energy +${restGain} (now ${player.energy})`;
      break;
    }

    case "buy_clothes": {
      player.happiness = Math.min(100, player.happiness + 8);
      message = "Bought a sharp new outfit! Happiness +8";
      break;
    }

    case "buy_electronics": {
      player.happiness = Math.min(100, player.happiness + 15);
      message = "Bought some sweet electronics! Happiness +15";
      break;
    }

    case "pawn_item": {
      player.money += 25;
      player.happiness = Math.max(0, player.happiness - 5);
      message = "Pawned some belongings. +$25, Happiness -5";
      break;
    }

    case "deposit": {
      // Simplified: no separate bank balance for now
      message = "Money deposited safely.";
      break;
    }

    case "withdraw": {
      message = "Withdrew money from the bank.";
      break;
    }
  }

  return { game, message };
}

// Random events that can occur at end of week
interface RandomEvent {
  name: string;
  chance: number; // 0-1 probability
  apply: (player: Player) => string;
}

const RANDOM_EVENTS: RandomEvent[] = [
  {
    name: "mugged",
    chance: 0.08,
    apply: (p) => {
      const loss = Math.min(p.money, 30 + Math.floor(Math.random() * 40));
      p.money -= loss;
      p.happiness = Math.max(0, p.happiness - 10);
      return `🔫 You got mugged! Lost $${loss} and happiness -10`;
    },
  },
  {
    name: "found_money",
    chance: 0.10,
    apply: (p) => {
      const gain = 10 + Math.floor(Math.random() * 30);
      p.money += gain;
      return `💵 Found $${gain} on the street!`;
    },
  },
  {
    name: "food_poisoning",
    chance: 0.06,
    apply: (p) => {
      p.energy = Math.max(0, p.energy - 25);
      p.food = Math.max(0, p.food - 20);
      return `🤢 Food poisoning! Energy -25, Food -20`;
    },
  },
  {
    name: "good_mood",
    chance: 0.12,
    apply: (p) => {
      p.happiness = Math.min(100, p.happiness + 15);
      return `😄 Great week! Something just clicked. Happiness +15`;
    },
  },
  {
    name: "networking",
    chance: 0.08,
    apply: (p) => {
      p.career = Math.min(100, p.career + 8);
      return `🤝 Made great connections this week! Career +8`;
    },
  },
  {
    name: "inspiration",
    chance: 0.07,
    apply: (p) => {
      p.education = Math.min(100, p.education + 8);
      return `💡 Had a eureka moment! Education +8`;
    },
  },
  {
    name: "rent_increase",
    chance: 0.05,
    apply: (p) => {
      p.money -= 25;
      return `📈 Unexpected bill! Extra $25 charge this week.`;
    },
  },
  {
    name: "bonus",
    chance: 0.06,
    apply: (p) => {
      if (p.job) {
        const bonus = Math.floor(p.job.salary * 0.5);
        p.money += bonus;
        return `🎁 Surprise bonus from work! +$${bonus}`;
      }
      return "";
    },
  },
];

function rollRandomEvent(player: Player): GameEvent | null {
  for (const event of RANDOM_EVENTS) {
    if (Math.random() < event.chance) {
      const message = event.apply(player);
      if (message) {
        return { type: "random_event", message };
      }
    }
  }
  return null;
}

export function endWeek(game: GameState): { game: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];

  if (game.status !== "in_progress") {
    return { game, events };
  }

  // Food decay (hunger system)
  game.player.food = Math.max(0, game.player.food - FOOD_DECAY_PER_WEEK);

  if (game.player.food <= 0) {
    game.player.energy = Math.max(0, game.player.energy - HUNGER_ENERGY_PENALTY);
    game.player.happiness = Math.max(0, game.player.happiness - 10);
    events.push({ type: "starving", message: `🍽️ You're starving! Energy -${HUNGER_ENERGY_PENALTY}, Happiness -10. Buy food!` });
  } else if (game.player.food <= 25) {
    events.push({ type: "hunger", message: `⚠️ Getting hungry (food: ${game.player.food}). Buy food soon!` });
  }

  // Deduct rent
  game.player.money -= WEEKLY_RENT;
  events.push({ type: "rent_due", message: `Rent deducted: -$${WEEKLY_RENT}` });

  // Energy decay
  game.player.energy = Math.max(0, game.player.energy - 8);

  // Happiness decay
  game.player.happiness = Math.max(0, game.player.happiness - 4);

  // Check if fired (low energy while employed)
  if (game.player.job && game.player.energy < LOW_ENERGY_FIRE_THRESHOLD) {
    events.push({ type: "fired", message: `😰 Fired from ${game.player.job.title} — too exhausted to work!` });
    game.player.job = null;
    game.player.career = Math.max(0, game.player.career - 10);
  }

  // Check for going broke
  if (game.player.money < 0) {
    game.player.money = 0;
    game.player.happiness = Math.max(0, game.player.happiness - 5);
    events.push({ type: "rent_due", message: "💸 Can't afford rent! Happiness -5" });
  }

  // Random event
  const randomEvent = rollRandomEvent(game.player);
  if (randomEvent) {
    events.push(randomEvent);
    game.lastEvent = randomEvent.message;
  }

  // Advance week
  game.week += 1;
  game.player.timeUnits = TIME_UNITS_PER_WEEK;

  events.push({ type: "week_start", message: `📅 Week ${game.week} begins. Time units refreshed.` });

  // Check win condition (only for selected goals)
  const win = checkWin(game, game.player);
  if (win) {
    game.status = "won";
    events.push({ type: "game_over", message: "🎉 You reached all your goals! You win!" });
  }

  return { game, events };
}

export function checkWin(game: GameState, player: Player): boolean {
  const sel = game.goalSelection;
  const goals = game.goals;

  if (!sel.money && !sel.education && !sel.career && !sel.happiness) return false;

  if (sel.money && player.money < goals.money) return false;
  if (sel.education && player.education < goals.education) return false;
  if (sel.career && player.career < goals.career) return false;
  if (sel.happiness && player.happiness < goals.happiness) return false;

  return true;
}
