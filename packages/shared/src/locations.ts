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
  { id: "browse_jobs", name: "Browse Jobs", timeCost: 1, description: "See available jobs and apply" },
  { id: "work", name: "Work", timeCost: 4, description: "Earn money at your job" },
  { id: "buy_food", name: "Buy Food ($15)", timeCost: 1, moneyCost: 15, description: "Buy groceries (+40 food)" },
  { id: "buy_item", name: "Buy Item ($50)", timeCost: 1, moneyCost: 50, description: "Buy something nice (+10 happiness)" },
  { id: "pay_rent", name: "Pay Rent ($50)", timeCost: 1, moneyCost: 50, description: "Pay weekly rent" },
  { id: "have_fun", name: "Have Fun ($20)", timeCost: 2, moneyCost: 20, description: "Increase happiness" },
  { id: "rest", name: "Rest", timeCost: 2, description: "Recover energy" },
];
