"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameState, LOCATIONS, ACTIONS, LocationId, ActionId, getMovementCost, GameEvent, FOOD_DECAY_PER_WEEK, ENERGY_DECAY_PER_WEEK, WORK_MIN_ENERGY, BANK_TRANSFER_AMOUNT } from "@jones/shared";
import { moveToLocation, performAction, endWeek } from "@/lib/api";
import { LocationIcon } from "./LocationIcons";
import { assetPath } from "@/lib/assets";
import { GameDialog } from "./GameDialog";
import { playSound } from "@/lib/sounds";

interface GameBoardProps {
  game: GameState;
  onUpdate: (game: GameState) => void;
  onMessage: (msg: string) => void;
  onRestart: () => void;
}

export default function GameBoard({ game, onUpdate, onMessage, onRestart }: GameBoardProps) {
  const [confirmEndWeek, setConfirmEndWeek] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionId | null>(null);
  const [weekEvents, setWeekEvents] = useState<GameEvent[]>([]);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const currentLocation = useMemo(
    () => LOCATIONS.find((l) => l.id === game.player.position),
    [game.player.position]
  );

  const availableActions = useMemo(
    () => currentLocation ? ACTIONS.filter((a) => currentLocation.actions.includes(a.id)) : [],
    [currentLocation]
  );

  // On hard, ending the week is fatal if food or energy would hit 0 after the
  // week's decay. Warn the player while there's still time to eat / rest.
  const deathRisk = useMemo(() => {
    if (game.goalSelection?.difficulty !== "hard" || game.status !== "in_progress") return null;
    const foodFatal = game.player.food - FOOD_DECAY_PER_WEEK <= 0;
    const energyFatal = game.player.energy - ENERGY_DECAY_PER_WEEK <= 0;
    if (!foodFatal && !energyFatal) return null;
    if (foodFatal && energyFatal) return "starvation and exhaustion";
    return foodFatal ? "starvation" : "exhaustion";
  }, [game.goalSelection?.difficulty, game.status, game.player.food, game.player.energy]);

  // On easy/medium there's no death, but running out of food/energy still hurts
  // (starvation penalty, risk of being fired). Warn when a vital is about to run
  // out after this week's decay. Skipped on hard, which shows deathRisk instead.
  const lowVitals = useMemo(() => {
    if (game.goalSelection?.difficulty === "hard" || game.status !== "in_progress") return null;
    const foodLow = game.player.food - FOOD_DECAY_PER_WEEK <= 0;
    const energyLow = game.player.energy - ENERGY_DECAY_PER_WEEK <= 0;
    const running: string[] = [];
    if (foodLow) running.push("food");
    if (energyLow) running.push("energy");
    return running.length ? running.join(" and ") : null;
  }, [game.goalSelection?.difficulty, game.status, game.player.food, game.player.energy]);

  const handleMove = useCallback(async (locationId: LocationId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await moveToLocation(game.id, locationId);
      if (result.error) { playSound("error"); onMessage(`❌ ${result.error}`); }
      else { playSound("move"); onUpdate(result.game); }
    } catch {
      playSound("error"); onMessage("❌ Could not reach the game server. Please try again.");
    } finally {
      if (mounted.current) setIsSubmitting(false);
    }
  }, [game.id, isSubmitting, onMessage, onUpdate]);

  const handleAction = useCallback(async (actionId: ActionId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await performAction(game.id, actionId);
      if (result.error) {
        playSound("error"); onMessage(`❌ ${result.error}`);
      } else {
        playSound("action");
        onUpdate(result.game);
        if (result.message) onMessage(`✅ ${result.message}`);
      }
    } catch {
      playSound("error"); onMessage("❌ Could not reach the game server. Please try again.");
    } finally {
      if (mounted.current) setIsSubmitting(false);
    }
  }, [game.id, isSubmitting, onMessage, onUpdate]);

  const handleEndWeek = useCallback(async () => {
    if (isSubmitting) return;
    if (!confirmEndWeek) {
      setConfirmEndWeek(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => {
        if (mounted.current) setConfirmEndWeek(false);
        confirmTimer.current = null;
      }, 3000);
      return;
    }
    setConfirmEndWeek(false);
    setIsSubmitting(true);
    try {
      const result = await endWeek(game.id);
      playSound("week");
      onUpdate(result.game);
      setWeekEvents(result.events);
    } catch {
      playSound("error"); onMessage("❌ Could not reach the game server. Please try again.");
    } finally {
      if (mounted.current) setIsSubmitting(false);
    }
  }, [game.id, isSubmitting, onMessage, onUpdate, confirmEndWeek]);

  return (
    <div className="game-shell grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 xl:items-start">
      {/* LEFT — Board + Actions */}
      <div className="flex flex-col gap-3 min-h-0">
        {/* Week bar — retro header */}
        <div className="retro-panel flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
          <span className="pixel-text text-[9px] text-amber-400">WK {game.week}</span>
          <span className="text-sm font-mono"><span className="metric-icon text-cyan-300">TIME</span> <strong className="text-cyan-300">{game.player.timeUnits}</strong>h</span>
          <span className="flex min-w-0 max-w-[180px] items-center gap-1 text-xs text-gray-300 sm:max-w-[220px]">
            <span className="metric-icon shrink-0 text-amber-300">JOB</span>
            <span className="min-w-0 truncate">
              {game.player.job?.title || "Unemployed"}{game.player.job ? ` ($${game.player.job.salary})` : ""}
            </span>
          </span>
            <div className="ml-auto flex gap-2">
            <button
              onClick={handleEndWeek}
              disabled={isSubmitting}
              className={`retro-btn ${
                confirmEndWeek || deathRisk
                  ? "bg-red-700 hover:bg-red-800 animate-pulse"
                  : "bg-amber-700 hover:bg-amber-800"
              }`}
              title={deathRisk ? `Warning: ending the week now kills you from ${deathRisk}` : undefined}
            >
              {confirmEndWeek ? "CONFIRM?" : deathRisk ? "END WEEK 💀" : "END WEEK →"}
            </button>
            <button
              onClick={onRestart}
              disabled={isSubmitting}
              className="retro-btn bg-gray-700 hover:bg-red-800"
              title="Quit and start a new game"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Board — ring of locations */}
        <div className="relative scanlines board-window">
          <BoardRing
            playerPosition={game.player.position}
            jonesPosition={game.aiJones.position}
            onMove={handleMove}
            timeUnits={game.player.timeUnits}
            player={game.player}
            goals={game.goals}
          />
        </div>

        {/* Actions at current location */}
        <div className="retro-panel action-panel p-3">
          <h3 className="pixel-text text-[8px] text-gray-400 mb-2">
            📍 {currentLocation?.name?.toUpperCase()}
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                timeUnits={game.player.timeUnits}
                money={game.player.money}
                hasJob={!!game.player.job}
                energy={game.player.energy}
                food={game.player.food}
                education={game.player.education}
                happiness={game.player.happiness}
                bankBalance={game.player.bankBalance}
                rentPaidThisWeek={game.player.rentPaidThisWeek}
                onAction={(id) => setPendingAction(id)}
                disabled={isSubmitting}
              />
            ))}
            {availableActions.length === 0 && (
              <span className="text-gray-500 text-sm italic">No actions available here.</span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — Stats Panel */}
      <div className="flex flex-col gap-3 overflow-y-auto">
        {/* Player goals */}
        <div className="retro-panel hud-panel p-3">
          <h3 className="pixel-text text-[8px] text-cyan-400 mb-2">GOALS</h3>
          <div className="space-y-2">
            <GoalBar icon="$" label="Money" value={game.player.money} goal={game.goals.money} enabled={game.goalSelection?.money ?? true} />
            <GoalBar icon="EDU" label="Edu" value={game.player.education} goal={game.goals.education} enabled={game.goalSelection?.education ?? true} />
            <GoalBar icon="JOB" label="Career" value={game.player.career} goal={game.goals.career} enabled={game.goalSelection?.career ?? true} />
            <GoalBar icon="HAP" label="Happy" value={game.player.happiness} goal={game.goals.happiness} enabled={game.goalSelection?.happiness ?? true} />
          </div>
        </div>

        {/* Player vitals */}
        <div className="retro-panel hud-panel p-3">
          <h3 className="pixel-text text-[8px] text-green-400 mb-2">VITALS</h3>
          <div className="flex items-center justify-between mb-2 text-[11px] font-mono">
            <span className="text-amber-300">💰 ${game.player.money}</span>
            <span className="text-emerald-300" title="Safe from muggers">🏦 ${game.player.bankBalance}</span>
          </div>
          <div className="space-y-2">
            <StatBar icon="⚡" label="Energy" value={game.player.energy} warn={20} />
            <StatBar icon="FOOD" label="Food" value={game.player.food} warn={25} />
          </div>
          {deathRisk && (
            <div className="mt-2 border-2 border-red-500 bg-red-900/40 p-2 animate-pulse">
              <p className="pixel-text text-[8px] text-red-300 leading-relaxed">
                💀 DANGER: ending this week will kill you from {deathRisk}. Eat and/or rest first!
              </p>
            </div>
          )}
          {lowVitals && (
            <div className="mt-2 border-2 border-amber-500 bg-amber-900/40 p-2">
              <p className="pixel-text text-[8px] text-amber-300 leading-relaxed">
                ⚠️ LOW: your {lowVitals} will run out this week. Eat and/or rest to avoid penalties.
              </p>
            </div>
          )}
        </div>

        {/* Jones tracker */}
        <div className="retro-panel hud-panel p-3 opacity-90">
          <h3 className="pixel-text text-[8px] text-red-400 mb-2">JONES</h3>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-mono">
            <span className="text-green-300">$<span className="text-white">{game.aiJones.money}</span></span>
            <span className="text-blue-300">EDU <span className="text-white">{game.aiJones.education}</span></span>
            <span className="text-amber-300">JOB <span className="text-white">{game.aiJones.career}</span></span>
            <span className="text-pink-300">HAP <span className="text-white">{game.aiJones.happiness}</span></span>
            <span className="col-span-2 text-gray-400 text-[10px]">
              {game.aiJones.job?.title || "Unemployed"}
            </span>
          </div>
        </div>

        {/* Last event */}
        {game.lastEvent && (
          <div className="retro-panel hud-panel p-3 border-yellow-500/70">
            <h3 className="pixel-text text-[8px] text-yellow-400 mb-1">EVENT</h3>
            <p className="text-xs text-gray-300">{game.lastEvent}</p>
          </div>
        )}
      </div>

      {pendingAction && (() => {
        const action = ACTIONS.find((candidate) => candidate.id === pendingAction);
        if (!action) return null;
        return (
          <GameDialog
            eyebrow={currentLocation?.name.toUpperCase()}
            title={action.name.toUpperCase()}
            onClose={() => setPendingAction(null)}
            onConfirm={() => { setPendingAction(null); void handleAction(action.id); }}
            confirmLabel="DO IT"
          >
            <p>{action.description}.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono text-cyan-200">
              <span className="border border-slate-500/60 p-2">TIME <strong>{action.timeCost}h</strong></span>
              <span className="border border-slate-500/60 p-2">CASH <strong>{action.moneyCost ? `$${action.moneyCost}` : "FREE"}</strong></span>
            </div>
          </GameDialog>
        );
      })()}

      {weekEvents.length > 0 && (
        <GameDialog eyebrow={`WEEK ${game.week}`} title="WEEKLY REPORT" onClose={() => setWeekEvents([])}>
          <div className="space-y-2">
            {weekEvents.map((event, index) => <p key={`${event.type}-${index}`} className="border-b border-slate-500/40 pb-2 last:border-0">{event.message}</p>)}
          </div>
        </GameDialog>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────
// Sub-components — extracted and memoized
// ──────────────────────────────────────────────────

const GoalBar = memo(function GoalBar({ label, value, goal, icon, enabled }: { label: string; value: number; goal: number; icon: string; enabled: boolean }) {
  if (!enabled) return null;
  const pct = Math.min(100, (value / goal) * 100);
  const met = value >= goal;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="metric-icon text-amber-300">{icon}</span>
      <span className="w-12 truncate font-mono text-[10px] text-gray-400">{label}</span>
      <div className="flex-1 h-3 bg-gray-900 rounded border border-gray-700 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${met ? "bg-green-500" : "bg-cyan-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-16 text-right font-mono text-[10px] ${met ? "text-green-400" : "text-gray-300"}`}>
        {label === "Money" ? `$${value}` : value}/{label === "Money" ? `$${goal}` : goal}
      </span>
    </div>
  );
});

const StatBar = memo(function StatBar({ label, value, icon, warn }: { label: string; value: number; icon: string; warn: number }) {
  const pct = Math.min(100, value);
  const isLow = value <= warn;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="metric-icon text-green-300">{icon}</span>
      <span className="w-12 truncate font-mono text-[10px] text-gray-400">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-900 rounded border border-gray-700 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${isLow ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-8 text-right font-mono text-[10px] ${isLow ? "text-red-400" : "text-gray-300"}`}>{value}</span>
    </div>
  );
});

const ACTION_CATEGORIES: Record<string, { emoji: string; color: string }> = {
  study: { emoji: "📖", color: "border-blue-500/60 hover:border-blue-400" },
  browse_jobs: { emoji: "📋", color: "border-amber-500/60 hover:border-amber-400" },
  work: { emoji: "⛏️", color: "border-amber-500/60 hover:border-amber-400" },
  buy_food: { emoji: "🍔", color: "border-green-500/60 hover:border-green-400" },
  buy_item: { emoji: "🛒", color: "border-green-500/60 hover:border-green-400" },
  buy_clothes: { emoji: "👔", color: "border-pink-500/60 hover:border-pink-400" },
  buy_electronics: { emoji: "📺", color: "border-pink-500/60 hover:border-pink-400" },
  pay_rent: { emoji: "🏠", color: "border-gray-500/60 hover:border-gray-400" },
  have_fun: { emoji: "🎉", color: "border-purple-500/60 hover:border-purple-400" },
  rest: { emoji: "💤", color: "border-cyan-500/60 hover:border-cyan-400" },
  pawn_item: { emoji: "💎", color: "border-yellow-500/60 hover:border-yellow-400" },
  deposit: { emoji: "🏦", color: "border-green-500/60 hover:border-green-400" },
  withdraw: { emoji: "🏦", color: "border-red-500/60 hover:border-red-400" },
};

const ActionButton = memo(function ActionButton({ action, timeUnits, money, hasJob, energy, food, education, happiness, bankBalance, rentPaidThisWeek, onAction, disabled: isSubmitting }: {
  action: typeof ACTIONS[0];
  timeUnits: number;
  money: number;
  hasJob: boolean;
  energy: number;
  food: number;
  education: number;
  happiness: number;
  bankBalance: number;
  rentPaidThisWeek: boolean;
  onAction: (id: ActionId) => void;
  disabled: boolean;
}) {
  const canAffordTime = timeUnits >= action.timeCost;
  const canAffordMoney = !action.moneyCost || money >= action.moneyCost;

  // Reason this action would have no useful effect right now (maxed stat, no job,
  // too tired). Used to disable the button and explain why. Mirrors engine rules.
  let blockReason: string | null = null;
  switch (action.id) {
    case "work":
      if (!hasJob) blockReason = "You need a job first — visit ACNE Employment to get hired.";
      else if (energy < WORK_MIN_ENERGY) blockReason = "Too tired to work — rest to recover energy first.";
      break;
    case "rest":
      if (energy >= 100) blockReason = "Energy is already full.";
      break;
    case "buy_food":
      if (food >= 100) blockReason = "You're already well fed (food is full).";
      break;
    case "study":
      if (education >= 100) blockReason = "Education is already maxed out.";
      break;
    case "buy_item":
    case "buy_clothes":
    case "buy_electronics":
    case "have_fun":
      if (happiness >= 100) blockReason = "Happiness is already full.";
      break;
    case "pay_rent":
      if (rentPaidThisWeek) blockReason = "Rent is already paid for this week.";
      break;
    case "deposit":
      if (money < BANK_TRANSFER_AMOUNT) blockReason = `Need at least $${BANK_TRANSFER_AMOUNT} in cash to deposit.`;
      break;
    case "withdraw":
      if (bankBalance <= 0) blockReason = "Your bank account is empty.";
      break;
  }

  const disabled = isSubmitting || !canAffordTime || !canAffordMoney || !!blockReason;
  const cat = ACTION_CATEGORIES[action.id] || { emoji: "▶", color: "border-gray-500/60 hover:border-gray-400" };

  return (
    <button
      onClick={() => onAction(action.id)}
      disabled={disabled}
      aria-label={`${action.name} action`}
      title={blockReason ?? undefined}
      className={`flex-1 min-w-[160px] p-3 rounded-lg retro-panel border-2 text-left transition-all
        disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100
        hover:scale-[1.02] active:scale-[0.98] ${cat.color}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{cat.emoji}</span>
        <span className="font-bold text-sm text-gray-100">{action.name}</span>
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="text-[10px] text-cyan-300 font-mono font-bold">⏱ {action.timeCost}h</span>
        {action.moneyCost ? <span className="text-[10px] text-amber-300 font-mono font-bold">💰 ${action.moneyCost}</span> : null}
      </div>
      <span className="text-[10px] text-gray-500 block mt-1">
        {blockReason ?? action.description}
      </span>
    </button>
  );
});

// ──────────────────────────────────────────────────
// Board Ring Component — with center stats
// ──────────────────────────────────────────────────

interface BoardRingProps {
  playerPosition: LocationId;
  jonesPosition: LocationId;
  onMove: (id: LocationId) => void;
  timeUnits: number;
  player: GameState["player"];
  goals: GameState["goals"];
}

const BoardRing = memo(function BoardRing({ playerPosition, jonesPosition, onMove, timeUnits, player, goals }: BoardRingProps) {
  const top = LOCATIONS.slice(0, 4);
  const right = LOCATIONS.slice(4, 6);
  const bottom = LOCATIONS.slice(6, 10).reverse();
  const left = LOCATIONS.slice(10, 13).reverse();

  return (
    <div className="w-full h-full grid grid-rows-[auto_1fr_auto] grid-cols-[auto_1fr_auto] gap-2 p-2"
      style={{ backgroundImage: `url(${assetPath("assets/board-bg.png")})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: "8px" }}
    >
      {/* Top row */}
      <div className="col-span-3 grid grid-cols-4 gap-2">
        {top.map((loc) => (
          <Tile key={loc.id} loc={loc} playerPosition={playerPosition} jonesPosition={jonesPosition} onMove={onMove} timeUnits={timeUnits} />
        ))}
      </div>

      {/* Left column */}
      <div className="row-span-1 flex flex-col gap-2 justify-around">
        {left.map((loc) => (
          <Tile key={loc.id} loc={loc} popoverSide="right" popoverDirection={loc.id === "market" ? "up" : undefined} playerPosition={playerPosition} jonesPosition={jonesPosition} onMove={onMove} timeUnits={timeUnits} />
        ))}
      </div>

      {/* Center — player vs jones portraits */}
      <div className="row-span-1 flex items-center justify-center">
        <CenterStats player={player} goals={goals} />
      </div>

      {/* Right column */}
      <div className="row-span-1 flex flex-col gap-2 justify-around">
        {right.map((loc) => (
          <Tile key={loc.id} loc={loc} popoverSide="left" playerPosition={playerPosition} jonesPosition={jonesPosition} onMove={onMove} timeUnits={timeUnits} />
        ))}
      </div>

      {/* Bottom row */}
      <div className="col-span-3 grid grid-cols-4 gap-2">
        {bottom.map((loc) => (
          <Tile key={loc.id} loc={loc} playerPosition={playerPosition} jonesPosition={jonesPosition} onMove={onMove} timeUnits={timeUnits} />
        ))}
      </div>
    </div>
  );
});

// ──────────────────────────────────────────────────
// Center Stats
// ──────────────────────────────────────────────────

const CenterStats = memo(function CenterStats({ player }: { player: GameState["player"]; goals: GameState["goals"] }) {
  return (
    <div className="retro-panel flex min-w-0 flex-col items-center gap-1 p-2 sm:min-w-[200px] sm:gap-3 sm:p-4">
      {/* Character portrait */}
      <div className="flex items-end gap-1 sm:gap-4">
        <div className="flex flex-col items-center">
          <img
            src={assetPath("assets/characters/player.png")}
            alt="Player"
            className="h-16 w-10 object-contain drop-shadow-[0_0_6px_rgba(0,255,255,0.5)] sm:h-24 sm:w-14"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="pixel-text text-[7px] text-cyan-400 mt-1">YOU</span>
        </div>
        <span className="pixel-text text-[8px] text-gray-500 pb-6">VS</span>
        <div className="flex flex-col items-center">
          <img
            src={assetPath("assets/characters/jones.png")}
            alt="Jones"
            className="h-16 w-10 object-contain drop-shadow-[0_0_6px_rgba(255,0,0,0.5)] sm:h-24 sm:w-14"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="pixel-text text-[7px] text-red-400 mt-1">JONES</span>
        </div>
      </div>

      {/* Key vitals - compact */}
      <div className="grid w-full grid-cols-2 gap-x-2 gap-y-1 text-[8px] font-mono sm:gap-x-4 sm:text-[10px]">
        <span className={player.energy <= 20 ? "text-red-400 animate-pulse" : "text-green-300"}>⚡ {player.energy}</span>
        <span className="text-amber-300 text-right">💰 ${player.money}</span>
        <span className={player.food <= 25 ? "text-red-400 animate-pulse" : "text-green-300"}>🍔 {player.food}</span>
        <span className="text-cyan-300 text-right">⏱ {player.timeUnits}h</span>
      </div>
    </div>
  );
});

// ──────────────────────────────────────────────────
// Tile — with pixel icon and color-coded cost
// ──────────────────────────────────────────────────

const Tile = memo(function Tile({ loc, popoverSide, popoverDirection, playerPosition, jonesPosition, onMove, timeUnits }: {
  loc: typeof LOCATIONS[0];
  popoverSide?: "left" | "right";
  popoverDirection?: "up";
  playerPosition: LocationId;
  jonesPosition: LocationId;
  onMove: (id: LocationId) => void;
  timeUnits: number;
}) {
  const isHere = playerPosition === loc.id;
  const isJones = jonesPosition === loc.id;
  const cost = getMovementCost(playerPosition, loc.id);
  const canMove = cost <= timeUnits && !isHere;

  const handleClick = useCallback(() => onMove(loc.id), [onMove, loc.id]);

  // Color-code the cost
  const costColor = isHere ? "" : cost <= 1 ? "text-green-400" : cost <= 2 ? "text-yellow-400" : "text-orange-400";

  return (
    <button
      onClick={handleClick}
      disabled={!canMove}
      className={`retro-tile ${popoverSide ? `popover-${popoverSide}` : ""} ${popoverDirection ? `popover-${popoverDirection}` : ""} relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-150 ${
        isHere
          ? "border-cyan-400 bg-cyan-900/50 ring-2 ring-cyan-400/30 scale-[1.03]"
          : canMove
          ? "border-gray-600 bg-[#1a1a2e]/90 hover:border-green-400 hover:bg-[#1a2a3e] cursor-pointer hover:scale-[1.04] active:scale-[0.97]"
          : "border-gray-700/50 bg-gray-900/40 opacity-40 cursor-default"
      }`}
      title={`${loc.name} — ${isHere ? "You are here" : `Move cost: ${cost}h`}`}
    >
      <span className="location-icon-frame"><LocationIcon locationId={loc.id} size={64} /></span>
      <span className="mt-1 max-w-[72px] whitespace-normal text-center text-[7px] font-bold leading-tight pixel-text text-[#fff3c4] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] sm:max-w-[132px] sm:whitespace-nowrap">
        {loc.name}
      </span>
      {!isHere && <span className={`text-[11px] font-bold font-mono mt-0.5 ${costColor}`}>{cost}h</span>}
      {isHere && <span className="text-[8px] font-mono text-cyan-300 mt-0.5">📍 HERE</span>}
      <span className="location-popover absolute left-1/2 top-full z-30 mt-2 w-44 -translate-x-1/2 rounded border border-[#8a7a4c] bg-[#202b47] p-2.5 text-left text-[10px] leading-tight text-[#f7f0d3] shadow-xl">
        <strong className="block text-[#ffe39b] text-[11px]">{loc.name}</strong>
        <span className="mt-1 block text-slate-300">{loc.description}</span>
        {!isHere && <span className="mt-1.5 block font-mono text-cyan-300 font-bold">MOVE: {cost}h</span>}
      </span>
      {/* Player/Jones character markers */}
      {(isHere || isJones) && (
        <div className="absolute -top-3 -right-3 flex gap-0.5">
          {isHere && <img src={assetPath("assets/characters/player.png")} alt="Player" className="w-7 h-11 object-contain drop-shadow-[0_0_5px_rgba(0,255,255,0.7)]" style={{ imageRendering: "pixelated" }} />}
          {isJones && <img src={assetPath("assets/characters/jones.png")} alt="Jones" className="w-7 h-11 object-contain drop-shadow-[0_0_5px_rgba(255,0,0,0.7)]" style={{ imageRendering: "pixelated" }} />}
        </div>
      )}
    </button>
  );
});
