"use client";

import { memo, useCallback, useMemo } from "react";
import { GameState, LOCATIONS, ACTIONS, LocationId, ActionId, getMovementCost } from "@jones/shared";
import { moveToLocation, performAction, endWeek } from "@/lib/api";

interface GameBoardProps {
  game: GameState;
  onUpdate: (game: GameState) => void;
  onMessage: (msg: string) => void;
  onRestart: () => void;
}

export default function GameBoard({ game, onUpdate, onMessage, onRestart }: GameBoardProps) {
  const currentLocation = useMemo(
    () => LOCATIONS.find((l) => l.id === game.player.position),
    [game.player.position]
  );

  const availableActions = useMemo(
    () => currentLocation ? ACTIONS.filter((a) => currentLocation.actions.includes(a.id)) : [],
    [currentLocation]
  );

  const handleMove = useCallback(async (locationId: LocationId) => {
    const result = await moveToLocation(game.id, locationId);
    if (result.error) {
      onMessage(`❌ ${result.error}`);
    } else {
      onUpdate(result.game);
    }
  }, [game.id, onMessage, onUpdate]);

  const handleAction = useCallback(async (actionId: ActionId) => {
    const result = await performAction(game.id, actionId);
    if (result.error) {
      onMessage(`❌ ${result.error}`);
    } else {
      onUpdate(result.game);
      if (result.message) onMessage(`✅ ${result.message}`);
    }
  }, [game.id, onMessage, onUpdate]);

  const handleEndWeek = useCallback(async () => {
    const result = await endWeek(game.id);
    onUpdate(result.game);
    result.events.forEach((e) => onMessage(`📢 ${e.message}`));
  }, [game.id, onMessage, onUpdate]);

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-[1fr_320px] gap-4 h-[calc(100vh-60px)]">
      {/* LEFT — Board + Actions */}
      <div className="flex flex-col gap-4 min-h-0">
        {/* Week bar */}
        <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
          <span className="font-bold text-sm">📅 Week {game.week}</span>
          <span className="text-sm">⏱️ <strong>{game.player.timeUnits}</strong> hours left</span>
          <span className="text-sm">💼 {game.player.job?.title || "Unemployed"}{game.player.job ? ` ($${game.player.job.salary}/shift)` : ""}</span>
          <div className="flex gap-2">
            <button
              onClick={handleEndWeek}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 rounded font-semibold text-xs"
            >
              End Week →
            </button>
            <button
              onClick={onRestart}
              className="px-3 py-1.5 bg-gray-700 hover:bg-red-700 rounded font-semibold text-xs"
              title="Quit and start a new game"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Board — ring of locations */}
        <div className="flex-1 relative min-h-0">
          <BoardRing
            playerPosition={game.player.position}
            jonesPosition={game.aiJones.position}
            onMove={handleMove}
            timeUnits={game.player.timeUnits}
          />
        </div>

        {/* Actions at current location */}
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <h3 className="text-xs uppercase text-gray-400 font-semibold mb-2">
            📍 {currentLocation?.icon} {currentLocation?.name} — Available Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                timeUnits={game.player.timeUnits}
                money={game.player.money}
                onAction={handleAction}
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
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <h3 className="text-xs uppercase text-gray-400 font-semibold mb-2">👤 {game.player.name} — Goals</h3>
          <div className="space-y-1.5">
            <GoalBar icon="💰" label="Money" value={game.player.money} goal={game.goals.money} enabled={game.goalSelection?.money ?? true} />
            <GoalBar icon="🎓" label="Education" value={game.player.education} goal={game.goals.education} enabled={game.goalSelection?.education ?? true} />
            <GoalBar icon="💼" label="Career" value={game.player.career} goal={game.goals.career} enabled={game.goalSelection?.career ?? true} />
            <GoalBar icon="😊" label="Happiness" value={game.player.happiness} goal={game.goals.happiness} enabled={game.goalSelection?.happiness ?? true} />
          </div>
        </div>

        {/* Player vitals */}
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <h3 className="text-xs uppercase text-gray-400 font-semibold mb-2">Vitals</h3>
          <div className="space-y-1.5">
            <StatBar icon="⚡" label="Energy" value={game.player.energy} warn={20} />
            <StatBar icon="🍔" label="Food" value={game.player.food} warn={25} />
          </div>
        </div>

        {/* Jones tracker */}
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 opacity-80">
          <h3 className="text-xs uppercase text-gray-400 font-semibold mb-2">🤖 Jones</h3>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span>💰 ${game.aiJones.money}</span>
            <span>🎓 {game.aiJones.education}</span>
            <span>💼 {game.aiJones.career}</span>
            <span>😊 {game.aiJones.happiness}</span>
            <span className="col-span-2 text-gray-400">
              Job: {game.aiJones.job?.title || "Unemployed"}
            </span>
          </div>
        </div>

        {/* Last event */}
        {game.lastEvent && (
          <div className="bg-gray-800 rounded-lg p-3 border border-yellow-700/50">
            <h3 className="text-xs uppercase text-yellow-500 font-semibold mb-1">🎲 Last Event</h3>
            <p className="text-xs text-gray-300">{game.lastEvent}</p>
          </div>
        )}
      </div>
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
      <span className="w-4">{icon}</span>
      <span className="w-16 truncate">{label}</span>
      <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${met ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-16 text-right font-mono ${met ? "text-green-400" : ""}`}>
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
      <span className="w-4">{icon}</span>
      <span className="w-12 truncate">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isLow ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-8 text-right font-mono ${isLow ? "text-red-400" : ""}`}>{value}</span>
    </div>
  );
});

const ActionButton = memo(function ActionButton({ action, timeUnits, money, onAction }: {
  action: typeof ACTIONS[0];
  timeUnits: number;
  money: number;
  onAction: (id: ActionId) => void;
}) {
  const canAffordTime = timeUnits >= action.timeCost;
  const canAffordMoney = !action.moneyCost || money >= action.moneyCost;
  const disabled = !canAffordTime || !canAffordMoney;
  return (
    <button
      onClick={() => onAction(action.id)}
      disabled={disabled}
      className="flex-1 min-w-[140px] p-2.5 rounded border border-gray-600 bg-gray-750 hover:border-green-500 hover:bg-gray-700 text-left disabled:opacity-40 disabled:cursor-not-allowed transition"
    >
      <span className="font-semibold text-sm block">{action.name}</span>
      <span className="text-[10px] text-gray-400 block">
        ⏱️{action.timeCost}h{action.moneyCost ? ` · 💰$${action.moneyCost}` : ""} — {action.description}
      </span>
    </button>
  );
});

// ──────────────────────────────────────────────────
// Board Ring Component — memoized with stable tiles
// ──────────────────────────────────────────────────

const BoardRing = memo(function BoardRing({
  playerPosition,
  jonesPosition,
  onMove,
  timeUnits,
}: {
  playerPosition: LocationId;
  jonesPosition: LocationId;
  onMove: (id: LocationId) => void;
  timeUnits: number;
}) {
  const top = LOCATIONS.slice(0, 4);
  const right = LOCATIONS.slice(4, 6);
  const bottom = LOCATIONS.slice(6, 10).reverse();
  const left = LOCATIONS.slice(10, 13).reverse();

  return (
    <div className="w-full h-full grid grid-rows-[auto_1fr_auto] grid-cols-[auto_1fr_auto] gap-1">
      {/* Top row */}
      <div className="col-span-3 grid grid-cols-4 gap-1">
        {top.map((loc) => (
          <Tile key={loc.id} loc={loc} playerPosition={playerPosition} jonesPosition={jonesPosition} onMove={onMove} timeUnits={timeUnits} />
        ))}
      </div>

      {/* Left column */}
      <div className="row-span-1 flex flex-col gap-1 justify-center">
        {left.map((loc) => (
          <Tile key={loc.id} loc={loc} playerPosition={playerPosition} jonesPosition={jonesPosition} onMove={onMove} timeUnits={timeUnits} />
        ))}
      </div>

      {/* Center */}
      <div className="row-span-1 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p className="text-3xl mb-1">🏙️</p>
          <p className="text-xs font-semibold">TOWN</p>
          <p className="text-[10px] text-gray-500">Move around the ring</p>
          <p className="text-[10px] text-gray-500">to visit locations</p>
        </div>
      </div>

      {/* Right column */}
      <div className="row-span-1 flex flex-col gap-1 justify-center">
        {right.map((loc) => (
          <Tile key={loc.id} loc={loc} playerPosition={playerPosition} jonesPosition={jonesPosition} onMove={onMove} timeUnits={timeUnits} />
        ))}
      </div>

      {/* Bottom row */}
      <div className="col-span-3 grid grid-cols-4 gap-1">
        {bottom.map((loc) => (
          <Tile key={loc.id} loc={loc} playerPosition={playerPosition} jonesPosition={jonesPosition} onMove={onMove} timeUnits={timeUnits} />
        ))}
      </div>
    </div>
  );
});

const Tile = memo(function Tile({ loc, playerPosition, jonesPosition, onMove, timeUnits }: {
  loc: typeof LOCATIONS[0];
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

  return (
    <button
      onClick={handleClick}
      disabled={isHere}
      className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg border-2 transition-all min-h-[70px] ${
        isHere
          ? "border-blue-400 bg-blue-900/50 ring-2 ring-blue-400/50"
          : canMove
          ? "border-gray-600 bg-gray-800 hover:border-green-500 hover:bg-gray-750 cursor-pointer"
          : "border-gray-700 bg-gray-800/50 opacity-60"
      }`}
      title={`${loc.name} — ${isHere ? "You are here" : `Move cost: ${cost}h`}`}
    >
      <span className="text-xl">{loc.icon}</span>
      <span className="text-[9px] leading-tight text-center font-medium mt-0.5">{loc.name}</span>
      {!isHere && <span className="text-[8px] text-gray-500">{cost}h</span>}
      {/* Player/Jones markers */}
      <div className="absolute -top-1 -right-1 flex gap-0.5">
        {isHere && <span className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-300 text-[8px] flex items-center justify-center">P</span>}
        {isJones && <span className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-300 text-[8px] flex items-center justify-center">J</span>}
      </div>
    </button>
  );
});
