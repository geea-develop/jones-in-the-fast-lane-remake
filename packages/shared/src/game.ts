import { LocationId } from "./locations.js";

export interface Job {
  id: string;
  title: string;
  salary: number;
  educationRequired: number;
}

export interface Player {
  id: string;
  name: string;
  money: number;
  education: number;   // 0–100
  career: number;      // 0–100
  happiness: number;   // 0–100
  energy: number;      // 0–100
  timeUnits: number;   // remaining this week
  position: LocationId;
  job: Job | null;
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
  status: "in_progress" | "won" | "lost";
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_GOALS: Goals = {
  money: 500,
  education: 60,
  career: 60,
  happiness: 60,
};

export const TIME_UNITS_PER_WEEK = 10;

export const WEEKLY_RENT = 50;
