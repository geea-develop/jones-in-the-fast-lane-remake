import { GameState, LocationId, ActionId, ACTIONS, TIME_UNITS_PER_WEEK, WEEKLY_RENT } from "@jones/shared";
import { GameEvent } from "@jones/shared";
import { checkWin } from "./engine.js";

/**
 * Simple AI Jones turn — prioritizes whatever goal category is weakest,
 * then makes moves/actions accordingly until time runs out.
 */
export function runJonesTurn(game: GameState): { game: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const jones = game.aiJones;

  // Reset time for Jones's turn
  jones.timeUnits = TIME_UNITS_PER_WEEK;

  // Determine priority based on what's furthest from goal
  const gaps = {
    education: game.goals.education - jones.education,
    career: game.goals.career - jones.career,
    happiness: game.goals.happiness - jones.happiness,
    money: game.goals.money - jones.money,
  };

  while (jones.timeUnits > 0) {
    const action = chooseAction(game, gaps);
    if (!action) break;

    // Move to location if needed
    const targetLocation = getLocationForAction(action);
    if (jones.position !== targetLocation && jones.timeUnits >= 1) {
      jones.position = targetLocation;
      jones.timeUnits -= 1;
    }

    const actionDef = ACTIONS.find((a) => a.id === action);
    if (!actionDef || jones.timeUnits < actionDef.timeCost) break;

    // Check money cost
    if (actionDef.moneyCost && jones.money < actionDef.moneyCost) {
      // Switch to work if can't afford
      if (jones.job && jones.timeUnits >= 4) {
        jones.position = "workplace";
        jones.timeUnits -= 1;
        jones.money += jones.job.salary;
        jones.timeUnits -= 4;
        jones.career = Math.min(100, jones.career + 3);
        continue;
      }
      break;
    }

    // Execute action
    jones.timeUnits -= actionDef.timeCost;
    if (actionDef.moneyCost) jones.money -= actionDef.moneyCost;

    switch (action) {
      case "study":
        jones.education = Math.min(100, jones.education + 12);
        break;
      case "browse_jobs":
        if (jones.education >= 40) {
          jones.job = { id: "manager", title: "Manager", salary: 80, educationRequired: 40 };
          jones.career = Math.min(100, jones.career + 20);
        } else if (jones.education >= 20) {
          jones.job = { id: "clerk", title: "Clerk", salary: 40, educationRequired: 20 };
          jones.career = Math.min(100, jones.career + 10);
        } else if (!jones.job) {
          jones.job = { id: "laborer", title: "Laborer", salary: 20, educationRequired: 0 };
          jones.career = Math.min(100, jones.career + 5);
        }
        break;
      case "work":
        if (jones.job) {
          jones.money += jones.job.salary;
          jones.career = Math.min(100, jones.career + 3);
          jones.energy = Math.max(0, jones.energy - 15);
        }
        break;
      case "have_fun":
        jones.happiness = Math.min(100, jones.happiness + 20);
        break;
      case "rest":
        jones.energy = Math.min(100, jones.energy + 40);
        break;
      case "buy_food":
        jones.energy = Math.min(100, jones.energy + 30);
        break;
    }
  }

  // Jones pays rent too
  jones.money -= WEEKLY_RENT;
  if (jones.money < 0) jones.money = 0;
  jones.happiness = Math.max(0, jones.happiness - 5);
  jones.energy = Math.max(0, jones.energy - 10);

  // Check if Jones won
  if (checkWin(game, jones)) {
    game.status = "lost";
    events.push({ type: "game_over", message: "😞 Jones reached all goals before you! Game over." });
  }

  return { game, events };
}

function chooseAction(game: GameState, gaps: Record<string, number>): ActionId | null {
  const jones = game.aiJones;

  // If energy is critical, rest first
  if (jones.energy < 20) return "rest";

  // If no job, get one
  if (!jones.job) return "browse_jobs";

  // Find biggest gap and act on it
  const sorted = Object.entries(gaps).sort((a, b) => b[1] - a[1]);
  const [topNeed] = sorted[0];

  switch (topNeed) {
    case "education":
      return "study";
    case "career":
      return jones.job ? "work" : "browse_jobs";
    case "happiness":
      return jones.money >= 20 ? "have_fun" : "work";
    case "money":
      return jones.job ? "work" : "browse_jobs";
    default:
      return "work";
  }
}

function getLocationForAction(action: ActionId): LocationId {
  switch (action) {
    case "study": return "university";
    case "browse_jobs": return "employment_office";
    case "work": return "workplace";
    case "buy_food":
    case "buy_item": return "store";
    case "pay_rent": return "rent_office";
    case "have_fun": return "entertainment";
    case "rest": return "home";
  }
}
