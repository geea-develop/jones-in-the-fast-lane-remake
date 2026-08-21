"use client";

import { GameState, LOCATIONS, ACTIONS, LocationId, ActionId } from "@jones/shared";
import { moveToLocation, performAction, endWeek } from "@/lib/api";

interface GameBoardProps {
  game: GameState;
  onUpdate: (game: GameState) => void;
  onMessage: (msg: string) => void;
}

const LOCATION_ICONS: Record<LocationId, string> = {
  university: "🎓",
  employment_office: "📋",
  workplace: "🏭",
  store: "🛒",
  rent_office: "🏠",
  entertainment: "🎮",
  home: "🛋️",
};

export default function GameBoard({ game, onUpdate, onMessage }: GameBoardProps) {
  const currentLocation = LOCATIONS.find((l) => l.id === game.player.position);
  const availableActions = currentLocation
    ? ACTIONS.filter((a) => currentLocation.actions.includes(a.id))
    : [];

  async function handleMove(locationId: LocationId) {
    const result = await moveToLocation(game.id, locationId);
    if (result.error) {
      onMessage(`❌ ${result.error}`);
    } else {
      onUpdate(result.game);
    }
  }

  async function handleAction(actionId: ActionId) {
    const result = await performAction(game.id, actionId);
    if (result.error) {
      onMessage(`❌ ${result.error}`);
    } else {
      onUpdate(result.game);
      if (result.message) onMessage(`✅ ${result.message}`);
    }
  }

  async function handleEndWeek() {
    const result = await endWeek(game.id);
    onUpdate(result.game);
    result.events.forEach((e) => onMessage(`📢 ${e.message}`));
  }

  return (
    <div className="space-y-6">
      {/* Player HUD */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="font-bold text-lg mb-2">👤 {game.player.name}</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span>💰 Money: <strong>${game.player.money}</strong> <span className="text-gray-500">(goal: ${game.goals.money})</span></span>
            <span>🎓 Education: <strong>{game.player.education}</strong> <span className="text-gray-500">({game.goals.education})</span></span>
            <span>💼 Career: <strong>{game.player.career}</strong> <span className="text-gray-500">({game.goals.career})</span></span>
            <span>😊 Happiness: <strong>{game.player.happiness}</strong> <span className="text-gray-500">({game.goals.happiness})</span></span>
            <span>⚡ Energy: <strong>{game.player.energy}</strong></span>
            <span>💼 Job: <strong>{game.player.job?.title || "None"}</strong></span>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 opacity-70">
          <h2 className="font-bold text-lg mb-2">🤖 Jones</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span>💰 ${game.aiJones.money}</span>
            <span>🎓 {game.aiJones.education}</span>
            <span>💼 {game.aiJones.career}</span>
            <span>😊 {game.aiJones.happiness}</span>
          </div>
        </div>
      </div>

      {/* Week & Time */}
      <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700">
        <span className="font-semibold">📅 Week {game.week}</span>
        <span>⏱️ Time remaining: <strong>{game.player.timeUnits}</strong> units</span>
        <button
          onClick={handleEndWeek}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded font-semibold text-sm"
        >
          End Week →
        </button>
      </div>

      {/* Location Map */}
      <div>
        <h3 className="font-semibold mb-2 text-gray-400 text-sm uppercase">Town Map — click to move</h3>
        <div className="grid grid-cols-4 gap-2">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              onClick={() => handleMove(loc.id)}
              disabled={game.player.position === loc.id}
              className={`p-3 rounded-lg text-center border transition ${
                game.player.position === loc.id
                  ? "bg-blue-900 border-blue-500 ring-2 ring-blue-400"
                  : "bg-gray-800 border-gray-700 hover:border-gray-500 hover:bg-gray-750"
              }`}
            >
              <span className="text-2xl block">{LOCATION_ICONS[loc.id]}</span>
              <span className="text-xs">{loc.name}</span>
              {game.player.position === loc.id && <span className="block text-xs text-blue-300">📍 Here</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Actions at Current Location */}
      <div>
        <h3 className="font-semibold mb-2 text-gray-400 text-sm uppercase">
          Actions at {currentLocation?.name}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {availableActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              disabled={game.player.timeUnits < action.timeCost}
              className="p-3 rounded-lg bg-gray-800 border border-gray-700 hover:border-green-500 hover:bg-gray-750 text-left disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="font-semibold">{action.name}</span>
              <span className="block text-xs text-gray-400">
                ⏱️ {action.timeCost} time{action.moneyCost ? ` | 💰 $${action.moneyCost}` : ""}
              </span>
              <span className="block text-xs text-gray-500">{action.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}