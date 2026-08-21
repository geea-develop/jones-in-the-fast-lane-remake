import {
  GameState,
  LocationId,
  ActionId,
  ACTIONS,
  JOBS,
  TIME_UNITS_PER_WEEK,
  WEEKLY_RENT,
  FOOD_DECAY_PER_WEEK,
  HUNGER_ENERGY_PENALTY,
  getMovementCost,
} from "@jones/shared";
import { GameEvent } from "@jones/shared";
import { checkWin } from "./engine.js";

type JonesStrategy = "balanced" | "career_rush" | "education_first" | "money_grind";

/**
 * Improved AI Jones — picks a strategy at game start and adapts based on state.
 * Manages hunger, energy, and priorities more intelligently.
 */
export function runJonesTurn(game: GameState): { game: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const jones = game.aiJones;

  // Reset time for Jones's turn
  jones.timeUnits = TIME_UNITS_PER_WEEK;

  // Pick strategy based on game progress
  const strategy = pickStrategy(game);

  // Jones also suffers food decay
  jones.food = Math.max(0, jones.food - FOOD_DECAY_PER_WEEK);
  if (jones.food <= 0) {
    jones.energy = Math.max(0, jones.energy - HUNGER_ENERGY_PENALTY);
    jones.happiness = Math.max(0, jones.happiness - 10);
  }

  // Execute actions until time runs out
  let actions = 0;
  while (jones.timeUnits > 0 && actions < 20) {
    actions++;
    const action = chooseAction(game, strategy);
    if (!action) break;

    const targetLocation = getLocationForAction(action);

    // Move if needed
    if (jones.position !== targetLocation) {
      const moveCost = getMovementCost(jones.position, targetLocation);
      if (jones.timeUnits < moveCost) break;
      jones.position = targetLocation;
      jones.timeUnits -= moveCost;
    }

    const actionDef = ACTIONS.find((a) => a.id === action);
    if (!actionDef || jones.timeUnits < actionDef.timeCost) break;
    if (actionDef.moneyCost && jones.money < actionDef.moneyCost) {
      // Need money — go work if possible
      if (jones.job && jones.timeUnits >= 5) {
        const workMoveCost = getMovementCost(jones.position, "workplace");
        if (jones.timeUnits >= workMoveCost + 4) {
          jones.position = "workplace";
          jones.timeUnits -= workMoveCost;
          jones.money += jones.job.salary;
          jones.timeUnits -= 4;
          jones.energy = Math.max(0, jones.energy - 20);
          jones.career = Math.min(100, jones.career + jones.job.careerGain);
          continue;
        }
      }
      break;
    }

    // Execute
    jones.timeUnits -= actionDef.timeCost;
    if (actionDef.moneyCost) jones.money -= actionDef.moneyCost;

    switch (action) {
      case "study":
        jones.education = Math.min(100, jones.education + 10 + Math.floor(Math.random() * 5));
        jones.energy = Math.max(0, jones.energy - 10);
        break;
      case "browse_jobs": {
        const available = JOBS.filter((j) => jones.education >= j.educationRequired);
        const best = available[available.length - 1];
        if (best && (!jones.job || best.salary > jones.job.salary)) {
          jones.job = best;
          jones.career = Math.min(100, jones.career + best.careerGain);
          jones.turnsEmployed = 0;
        }
        break;
      }
      case "work":
        if (jones.job) {
          jones.money += jones.job.salary;
          jones.career = Math.min(100, jones.career + jones.job.careerGain);
          jones.energy = Math.max(0, jones.energy - 20);
          jones.turnsEmployed += 1;
        }
        break;
      case "have_fun":
        jones.happiness = Math.min(100, jones.happiness + 18 + Math.floor(Math.random() * 8));
        jones.energy = Math.max(0, jones.energy - 5);
        break;
      case "rest":
        jones.energy = Math.min(100, jones.energy + 35 + Math.floor(Math.random() * 15));
        break;
      case "buy_food":
        jones.food = Math.min(100, jones.food + 40);
        break;
    }
  }

  // Jones pays rent
  jones.money -= WEEKLY_RENT;
  if (jones.money < 0) jones.money = 0;
  jones.happiness = Math.max(0, jones.happiness - 4);
  jones.energy = Math.max(0, jones.energy - 8);

  // Check if Jones won
  if (checkWin(game, jones)) {
    game.status = "lost";
    events.push({ type: "game_over", message: "😞 Jones reached all goals before you! Game over." });
  }

  return { game, events };
}

function pickStrategy(game: GameState): JonesStrategy {
  const jones = game.aiJones;
  const week = game.week;

  // Early game: focus on education to unlock better jobs
  if (week <= 4 && jones.education < 30) return "education_first";

  // If no job or bad job, focus on career path
  if (!jones.job || jones.job.salary < 45) return "career_rush";

  // Mid-game: grind money if far from goal
  if (jones.money < game.goals.money * 0.5) return "money_grind";

  // Default: balanced approach
  return "balanced";
}

function chooseAction(game: GameState, strategy: JonesStrategy): ActionId | null {
  const jones = game.aiJones;

  // Survival priorities (always take precedence)
  if (jones.food <= 20 && jones.money >= 15) return "buy_food";
  if (jones.energy < 20) return "rest";
  if (!jones.job) return "browse_jobs";

  // Strategy-specific choices
  switch (strategy) {
    case "education_first":
      if (jones.education < 60) return "study";
      return "browse_jobs";

    case "career_rush":
      if (jones.education < getNextJobRequirement(jones)) return "study";
      if (shouldUpgradeJob(jones)) return "browse_jobs";
      return jones.job ? "work" : "browse_jobs";

    case "money_grind":
      if (jones.happiness < 25) return "have_fun";
      return jones.job ? "work" : "browse_jobs";

    case "balanced": {
      const gaps = {
        education: game.goals.education - jones.education,
        career: game.goals.career - jones.career,
        happiness: game.goals.happiness - jones.happiness,
        money: game.goals.money - jones.money,
      };

      const sorted = Object.entries(gaps).sort((a, b) => b[1] - a[1]);
      const [topNeed] = sorted[0];

      switch (topNeed) {
        case "education": return "study";
        case "career": return jones.job ? "work" : "browse_jobs";
        case "happiness": return jones.money >= 20 ? "have_fun" : "work";
        case "money": return jones.job ? "work" : "browse_jobs";
      }
    }
  }

  return "work";
}

function getNextJobRequirement(jones: typeof JOBS extends (infer T)[] ? { education: number; job: typeof JOBS[0] | null } : never): number {
  const currentSalary = jones.job?.salary || 0;
  const nextJob = JOBS.find((j) => j.salary > currentSalary);
  return nextJob?.educationRequired || 100;
}

function shouldUpgradeJob(jones: { education: number; job: typeof JOBS[0] | null }): boolean {
  const currentSalary = jones.job?.salary || 0;
  const available = JOBS.filter((j) => jones.education >= j.educationRequired && j.salary > currentSalary);
  return available.length > 0;
}

function getLocationForAction(action: ActionId): LocationId {
  switch (action) {
    case "study": return "university";
    case "browse_jobs": return "employment_office";
    case "work": return "workplace";
    case "buy_food": return "store";
    case "buy_item": return "store";
    case "buy_clothes": return "clothing_store";
    case "buy_electronics": return "electronics";
    case "pay_rent": return "rent_office";
    case "have_fun": return "entertainment";
    case "rest": return "home";
    case "pawn_item": return "pawn_shop";
    case "deposit":
    case "withdraw": return "bank";
  }
}
