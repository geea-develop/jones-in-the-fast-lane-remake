import { LocationId } from "./locations.js";

export interface Job {
  id: string;
  title: string;
  salary: number;
  educationRequired: number;
  careerGain: number;
}

export const JOBS: Job[] = [
  { id: "dishwasher", title: "Dishwasher", salary: 15, educationRequired: 0, careerGain: 2 },
  { id: "janitor", title: "Janitor", salary: 20, educationRequired: 0, careerGain: 3 },
  { id: "clerk", title: "Clerk", salary: 35, educationRequired: 15, careerGain: 5 },
  { id: "factory_worker", title: "Factory Worker", salary: 45, educationRequired: 20, careerGain: 6 },
  { id: "salesperson", title: "Salesperson", salary: 55, educationRequired: 30, careerGain: 8 },
  { id: "technician", title: "Technician", salary: 70, educationRequired: 45, careerGain: 10 },
  { id: "manager", title: "Manager", salary: 90, educationRequired: 60, careerGain: 12 },
  { id: "executive", title: "Executive", salary: 120, educationRequired: 75, careerGain: 15 },
  { id: "ceo", title: "CEO", salary: 200, educationRequired: 90, careerGain: 20 },
];

export type Difficulty = "easy" | "medium" | "hard";

export interface GoalSelection {
  money: boolean;
  education: boolean;
  career: boolean;
  happiness: boolean;
  difficulty: Difficulty;
}

export interface Player {
  id: string;
  name: string;
  money: number;
  education: number;   // 0–100
  career: number;      // 0–100
  happiness: number;   // 0–100
  energy: number;      // 0–100
  food: number;        // 0–100 (hunger: depletes each week)
  timeUnits: number;   // remaining this week
  position: LocationId;
  job: Job | null;
  turnsEmployed: number; // weeks at current job (fired if 0 energy while employed)
}

export interface Goals {
  money: number;       // target $ amount
  education: number;   // target level (0–100)
  career: number;      // target level (0–100)
  happiness: number;   // target level (0–100)
}

export interface GameState {
  id: string;
  player: Player;
  aiJones: Player;
  week: number;
  goals: Goals;
  goalSelection: GoalSelection;
  status: "in_progress" | "won" | "lost";
  lastEvent: string | null; // most recent random event
  createdAt: string;
  updatedAt: string;
}

export const DIFFICULTY_GOALS: Record<Difficulty, Goals> = {
  easy: { money: 300, education: 40, career: 40, happiness: 50 },
  medium: { money: 500, education: 60, career: 60, happiness: 60 },
  hard: { money: 1000, education: 80, career: 80, happiness: 80 },
};

export const DEFAULT_GOALS: Goals = DIFFICULTY_GOALS.medium;

export const DEFAULT_GOAL_SELECTION: GoalSelection = {
  money: true,
  education: true,
  career: true,
  happiness: true,
  difficulty: "medium",
};

export const TIME_UNITS_PER_WEEK = 10;
export const WEEKLY_RENT = 50;
export const FOOD_DECAY_PER_WEEK = 25;    // food drops 25 per week
export const HUNGER_ENERGY_PENALTY = 30;   // lose 30 energy if food hits 0
export const LOW_ENERGY_FIRE_THRESHOLD = 10; // get fired if energy below this
