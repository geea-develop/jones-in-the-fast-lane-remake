export type LocationId =
  | "home"
  | "pawn_shop"
  | "store"
  | "burger_joint"
  | "clothing_store"
  | "electronics"
  | "university"
  | "employment_office"
  | "workplace"
  | "bank"
  | "market"
  | "rent_office"
  | "entertainment";

export interface Location {
  id: LocationId;
  name: string;
  description: string;
  actions: ActionId[];
  /** Position index on the ring (0 = top-left, clockwise) */
  boardPosition: number;
  icon: string;
  color: string;
}

export type ActionId =
  | "study"
  | "browse_jobs"
  | "work"
  | "buy_food"
  | "buy_item"
  | "buy_clothes"
  | "buy_electronics"
  | "pay_rent"
  | "have_fun"
  | "rest"
  | "pawn_item"
  | "deposit"
  | "withdraw";

export interface Action {
  id: ActionId;
  name: string;
  timeCost: number;
  moneyCost?: number;
  description: string;
}

export const LOCATIONS: Location[] = [
  {
    id: "home",
    name: "Home",
    description: "Low-cost housing. Rest to recover energy.",
    actions: ["rest"],
    boardPosition: 0,
    icon: "🏠",
    color: "#6b7280",
  },
  {
    id: "pawn_shop",
    name: "Pawn Shop",
    description: "Sell items for quick cash.",
    actions: ["pawn_item"],
    boardPosition: 1,
    icon: "🏪",
    color: "#92400e",
  },
  {
    id: "store",
    name: "Z-Mart",
    description: "Discount store — buy food and household items.",
    actions: ["buy_food", "buy_item"],
    boardPosition: 2,
    icon: "🛒",
    color: "#059669",
  },
  {
    id: "burger_joint",
    name: "Monolith Burgers",
    description: "Fast food — grab a quick meal.",
    actions: ["buy_food"],
    boardPosition: 3,
    icon: "🍔",
    color: "#dc2626",
  },
  {
    id: "clothing_store",
    name: "QT Clothing",
    description: "Buy clothes for happiness and job interviews.",
    actions: ["buy_clothes"],
    boardPosition: 4,
    icon: "👔",
    color: "#7c3aed",
  },
  {
    id: "electronics",
    name: "Socket City",
    description: "Buy electronics and appliances.",
    actions: ["buy_electronics"],
    boardPosition: 5,
    icon: "📺",
    color: "#0284c7",
  },
  {
    id: "university",
    name: "University",
    description: "Study to increase education and unlock better jobs.",
    actions: ["study"],
    boardPosition: 6,
    icon: "🎓",
    color: "#1d4ed8",
  },
  {
    id: "employment_office",
    name: "ACNE Employment",
    description: "Browse jobs. Apply for positions.",
    actions: ["browse_jobs"],
    boardPosition: 7,
    icon: "📋",
    color: "#b45309",
  },
  {
    id: "workplace",
    name: "Factory",
    description: "Go to work and earn money.",
    actions: ["work"],
    boardPosition: 8,
    icon: "🏭",
    color: "#4b5563",
  },
  {
    id: "bank",
    name: "Bank",
    description: "Deposit or withdraw money.",
    actions: ["deposit", "withdraw"],
    boardPosition: 9,
    icon: "🏦",
    color: "#166534",
  },
  {
    id: "market",
    name: "Black's Market",
    description: "Fresh food and the newspaper.",
    actions: ["buy_food"],
    boardPosition: 10,
    icon: "🥬",
    color: "#15803d",
  },
  {
    id: "rent_office",
    name: "Rent Office",
    description: "Pay your rent to keep your apartment.",
    actions: ["pay_rent"],
    boardPosition: 11,
    icon: "🔑",
    color: "#78350f",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Have fun — movies, arcade, nightlife.",
    actions: ["have_fun"],
    boardPosition: 12,
    icon: "🎬",
    color: "#be185d",
  },
];

/** Number of board positions (used for distance calc) */
export const BOARD_SIZE = LOCATIONS.length;

/** Calculate movement cost (hours) between two locations on the ring */
export function getMovementCost(from: LocationId, to: LocationId): number {
  if (from === to) return 0;
  const fromPos = LOCATIONS.find((l) => l.id === from)!.boardPosition;
  const toPos = LOCATIONS.find((l) => l.id === to)!.boardPosition;
  // Shortest path around the ring
  const clockwise = (toPos - fromPos + BOARD_SIZE) % BOARD_SIZE;
  const counterClockwise = (fromPos - toPos + BOARD_SIZE) % BOARD_SIZE;
  const distance = Math.min(clockwise, counterClockwise);
  // 1 hour per step
  return distance;
}

export const ACTIONS: Action[] = [
  { id: "study", name: "Study", timeCost: 3, description: "Attend classes (+8-15 education)" },
  { id: "browse_jobs", name: "Browse Jobs", timeCost: 1, description: "View listings and apply" },
  { id: "work", name: "Work Shift", timeCost: 4, description: "Earn money at your job" },
  { id: "buy_food", name: "Buy Food ($15)", timeCost: 1, moneyCost: 15, description: "Groceries (+40 food)" },
  { id: "buy_item", name: "Buy Item ($50)", timeCost: 1, moneyCost: 50, description: "Household goods (+10 happiness)" },
  { id: "buy_clothes", name: "Buy Clothes ($40)", timeCost: 1, moneyCost: 40, description: "New outfit (+8 happiness)" },
  { id: "buy_electronics", name: "Buy Electronics ($80)", timeCost: 1, moneyCost: 80, description: "Gadgets (+15 happiness)" },
  { id: "pay_rent", name: "Pay Rent ($50)", timeCost: 1, moneyCost: 50, description: "Weekly rent" },
  { id: "have_fun", name: "Have Fun ($20)", timeCost: 2, moneyCost: 20, description: "Entertainment (+15-25 happiness)" },
  { id: "rest", name: "Rest", timeCost: 2, description: "Sleep it off (+30-50 energy)" },
  { id: "pawn_item", name: "Pawn Item", timeCost: 1, description: "Sell belongings for quick cash (+$25)" },
  { id: "deposit", name: "Deposit", timeCost: 1, description: "Save money in the bank" },
  { id: "withdraw", name: "Withdraw", timeCost: 1, description: "Take money out of the bank" },
];
