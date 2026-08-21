export type LocationId =
  | "university"
  | "employment_office"
  | "workplace"
  | "store"
  | "rent_office"
  | "entertainment"
  | "home";

export interface Location {
  id: LocationId;
  name: string;
  description: string;
  actions: ActionId[];
}

export type ActionId =
  | "study"
  | "browse_jobs"
  | "work"
  | "buy_food"
  | "buy_item"
  | "pay_rent"
  | "have_fun"
  | "rest";

export interface Action {
  id: ActionId;
  name: string;
  timeCost: number;
  moneyCost?: number;
  description: string;
}

export const LOCATIONS: Location[] = [
  {
    id: "university",
    name: "University",
    description: "Study to increase your education level",
    actions: ["study"],
  },
  {
    id: "employment_office",
    name: "Employment Office",
    description: "Browse and apply for jobs",
    actions: ["browse_jobs"],
  },
  {
    id: "workplace",
    name: "Workplace",
    description: "Work to earn money (requires a job)",
    actions: ["work"],
  },
  {
    id: "store",
    name: "Store",
    description: "Buy food and items",
    actions: ["buy_food", "buy_item"],
  },
  {
    id: "rent_office",
    name: "Rent Office",
    description: "Pay your weekly rent",
    actions: ["pay_rent"],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Have fun to increase happiness",
    actions: ["have_fun"],
  },
  {
    id: "home",
    name: "Home",
    description: "Rest to recover energy",
    actions: ["rest"],
  },
];

export const ACTIONS: Action[] = [
  { id: "study", name: "Study", timeCost: 3, description: "Gain education points" },
  { id: "browse_jobs", name: "Browse Jobs", timeCost: 1, description: "See available jobs" },
  { id: "work", name: "Work", timeCost: 4, description: "Earn money at your job" },
  { id: "buy_food", name: "Buy Food", timeCost: 1, moneyCost: 10, description: "Buy food to stay alive" },
  { id: "buy_item", name: "Buy Item", timeCost: 1, description: "Buy useful items" },
  { id: "pay_rent", name: "Pay Rent", timeCost: 1, moneyCost: 50, description: "Pay weekly rent" },
  { id: "have_fun", name: "Have Fun", timeCost: 2, moneyCost: 20, description: "Increase happiness" },
  { id: "rest", name: "Rest", timeCost: 2, description: "Recover energy" },
];
