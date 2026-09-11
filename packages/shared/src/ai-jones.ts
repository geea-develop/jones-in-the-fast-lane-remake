import {
  LocationId,
  ActionId,
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
} from "./game.js";
import { GameEvent } from "./api.js";
import { checkWin } from "./engine.js";

type JonesStrategy = "balanced" | "career_rush" | "education_first" | "money_grind";

/**
 * AI Jones — competitive opponent that adapts strategy based on game state.
 * Properly manages survival (food, energy, happiness) while racing toward goals.
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

  // Track actions for turn summary
  const actionLog: Record<string, number> = {};

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
      // Can't afford — skip and try something else
      continue;
    }

    // Execute
    jones.timeUnits -= actionDef.timeCost;
    if (actionDef.moneyCost) jones.money -= actionDef.moneyCost;
    actionLog[action] = (actionLog[action] || 0) + 1;

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
          actionLog["got_new_job"] = 1;
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
      case "buy_clothes":
        jones.happiness = Math.min(100, jones.happiness + 8);
        break;
      case "buy_electronics":
        jones.happiness = Math.min(100, jones.happiness + 15);
        break;
      case "rest":
        jones.energy = Math.min(100, jones.energy + 35 + Math.floor(Math.random() * 15));
        break;
      case "buy_food":
        jones.food = Math.min(100, jones.food + 40);
        break;
    }
  }

  // Build turn summary
  const summary = buildJonesSummary(actionLog, jones);
  events.push({ type: "jones_turn", message: summary });

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

  // Early game: education is the unlock for everything
  if (week <= 6 && jones.education < 40) return "education_first";

  // If no job or a bad job and have enough education for better, go get it
  if (shouldUpgradeJob(jones)) return "career_rush";

  // If we have a decent job, figure out what we need most
  const gaps = getGoalGaps(game);
  const maxGap = Math.max(gaps.education, gaps.career, gaps.happiness, gaps.money);

  if (maxGap === gaps.money && jones.job) return "money_grind";
  if (maxGap === gaps.education) return "education_first";
  if (maxGap === gaps.career) return "career_rush";

  return "balanced";
}

function getGoalGaps(game: GameState) {
  const jones = game.aiJones;
  const goals = game.goals;
  return {
    education: Math.max(0, goals.education - jones.education) / goals.education,
    career: Math.max(0, goals.career - jones.career) / goals.career,
    happiness: Math.max(0, goals.happiness - jones.happiness) / goals.happiness,
    money: Math.max(0, goals.money - jones.money) / goals.money,
  };
}

function chooseAction(game: GameState, strategy: JonesStrategy): ActionId | null {
  const jones = game.aiJones;

  // === SURVIVAL (always top priority) ===
  // Buy food proactively — don't wait until starving
  if (jones.food <= 40 && jones.money >= 15) return "buy_food";
  // Rest when tired
  if (jones.energy < 30) return "rest";
  // Need happiness to avoid spiral
  if (jones.happiness < 20) {
    if (jones.money >= 40) return "buy_clothes";
    if (jones.money >= 20) return "have_fun";
    return jones.job ? "work" : "browse_jobs";
  }

  // === INCOME — always make sure we have a job ===
  if (!jones.job) return "browse_jobs";

  // === Work to build money buffer if broke (need rent + food money) ===
  if (jones.money < 40 && jones.job) return "work";

  // === STRATEGY-SPECIFIC ===
  switch (strategy) {
    case "education_first":
      if (jones.education < game.goals.education) return "study";
      // Education goal met, check if we can upgrade job
      if (shouldUpgradeJob(jones)) return "browse_jobs";
      return "work";

    case "career_rush":
      // Get education needed for next job
      if (jones.education < getNextJobRequirement(jones)) return "study";
      // Upgrade job
      if (shouldUpgradeJob(jones)) return "browse_jobs";
      // Work to build career points
      return jones.job ? "work" : "browse_jobs";

    case "money_grind":
      // Just work as much as possible
      if (jones.happiness < 35) return "have_fun";
      return jones.job ? "work" : "browse_jobs";

    case "balanced": {
      const gaps = getGoalGaps(game);

      // Find biggest gap and address it
      const priorities: [string, number][] = [
        ["education", gaps.education],
        ["career", gaps.career],
        ["happiness", gaps.happiness],
        ["money", gaps.money],
      ].filter(([, v]) => (v as number) > 0) as [string, number][];

      priorities.sort((a, b) => b[1] - a[1]);

      if (priorities.length === 0) return "work"; // All goals met? keep working

      const [topNeed] = priorities[0];

      switch (topNeed) {
        case "education": return "study";
        case "career":
          if (shouldUpgradeJob(jones)) return "browse_jobs";
          return jones.job ? "work" : "browse_jobs";
        case "happiness":
          if (jones.money >= 80) return "buy_electronics";
          if (jones.money >= 40) return "buy_clothes";
          return "have_fun";
        case "money":
          return jones.job ? "work" : "browse_jobs";
      }
    }
  }

  return "work";
}

function getNextJobRequirement(jones: { education: number; job: typeof JOBS[0] | null }): number {
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

function buildJonesSummary(actionLog: Record<string, number>, jones: Player): string {
  const parts: string[] = [];

  if (actionLog["work"]) parts.push(`worked ${actionLog["work"]}x`);
  if (actionLog["study"]) parts.push(`studied ${actionLog["study"]}x`);
  if (actionLog["have_fun"]) parts.push("had fun");
  if (actionLog["buy_food"]) parts.push("bought food");
  if (actionLog["buy_clothes"]) parts.push("bought clothes");
  if (actionLog["buy_electronics"]) parts.push("bought electronics");
  if (actionLog["rest"]) parts.push("rested");
  if (actionLog["got_new_job"]) parts.push(`got a job as ${jones.job?.title}`);
  if (actionLog["browse_jobs"] && !actionLog["got_new_job"]) parts.push("browsed jobs");

  if (parts.length === 0) parts.push("did nothing useful");

  return `🤖 Jones: ${parts.join(", ")}`;
}
