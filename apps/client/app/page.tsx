"use client";

import { useState, useEffect, useCallback } from "react";
import { GameState, GoalSelection, Difficulty, DIFFICULTY_GOALS } from "@jones/shared";
import { createGame, loadGame } from "@/lib/api";
import { getActiveOfflineGameId, setActiveOfflineGameId } from "@/lib/local-engine";
import GameBoard from "@/components/GameBoard";
import { useToasts, ToastContainer } from "@/components/Toast";
import { assetPath } from "@/lib/assets";

export default function Home() {
  const [game, setGame] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState("");
  const [offline, setOffline] = useState(false);
  const { toasts, addToast, dismissToast } = useToasts();
  const [goalSelection, setGoalSelection] = useState<GoalSelection>({
    money: true,
    education: true,
    career: true,
    happiness: true,
    difficulty: "medium",
  });

  // Auto-resume on mount. Prefer an active offline game (fully local, always
  // available with no internet); otherwise fall back to the online session id.
  useEffect(() => {
    let cancelled = false;
    const offlineId = getActiveOfflineGameId();
    const savedId = offlineId || sessionStorage.getItem("jones_game_id");
    if (savedId) {
      loadGame(savedId)
        .then((g) => {
          if (!cancelled && g && g.status === "in_progress") {
            setGame(g);
            addToast(offlineId ? "Offline game resumed." : "Game resumed from last session.", "info");
          }
        })
        .catch((err) => {
          if (!cancelled) console.error("Failed to resume game:", err);
        });
    }
    return () => { cancelled = true; };
  }, [addToast]);

  const handleMessage = useCallback((msg: string) => {
    // Determine toast type from message content
    const type = msg.startsWith("❌") ? "error" as const
      : msg.startsWith("🤖") ? "jones" as const
      : msg.startsWith("✅") ? "success" as const
      : "info" as const;
    addToast(msg, type);
  }, [addToast]);

  async function handleNewGame() {
    try {
      const g = await createGame({ playerName: playerName || "Player", goalSelection, offline });
      setGame(g);
      sessionStorage.setItem("jones_game_id", g.id);
      addToast(offline ? "Offline game started! No internet needed." : "New game started! Good luck!", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not start the game. Please try again.", "error");
    }
  }

  async function handleResume() {
    const id = gameId || sessionStorage.getItem("jones_game_id");
    if (!id) return;
    const g = await loadGame(id);
    if (g) {
      setGame(g);
      addToast("Game resumed!", "success");
    } else {
      addToast("Game not found", "error");
    }
  }

  const handleRestart = useCallback(() => {
    setGame(null);
    sessionStorage.removeItem("jones_game_id");
    setActiveOfflineGameId(null);
  }, []);

  // Game Over screen
  if (game && game.status !== "in_progress") {
    const won = game.status === "won";
    return (
      <main className="max-w-4xl mx-auto p-8 text-center">
        {/* Winner/Loser character display */}
        <div className="flex items-end justify-center gap-8 mb-6">
          <div className={`flex flex-col items-center ${won ? "scale-110" : "opacity-60 scale-90"}`}>
            <img src={assetPath("assets/characters/player.png")} alt="Player" className="w-20 h-36 object-contain" style={{ imageRendering: "pixelated" }} />
            <span className="pixel-text text-[8px] text-cyan-400 mt-1">{game.player.name.toUpperCase()}</span>
          </div>
          <div className={`flex flex-col items-center ${!won ? "scale-110" : "opacity-60 scale-90"}`}>
            <img src={assetPath("assets/characters/jones.png")} alt="Jones" className="w-20 h-36 object-contain" style={{ imageRendering: "pixelated" }} />
            <span className="pixel-text text-[8px] text-red-400 mt-1">JONES</span>
          </div>
        </div>

        <h1 className="pixel-text text-2xl mb-4 leading-relaxed">
          {won
            ? <span className="text-green-400">🎉 YOU WIN!</span>
            : <span className="text-red-400">💀 GAME OVER</span>}
        </h1>
        <p className="text-gray-400 mb-4">
          {won
            ? "You reached all your goals before Jones!"
            : "Jones beat you to the finish line."}
        </p>
        <p className="pixel-text text-[10px] text-gray-500">WEEK {game.week}</p>
        <div className="grid grid-cols-2 gap-4 mt-4 max-w-md mx-auto text-left">
          <div className="retro-panel p-3">
            <p className="pixel-text text-[8px] text-cyan-400 mb-1">{game.player.name.toUpperCase()}</p>
            <p className="font-mono text-sm">💰 ${game.player.money} | 🎓 {game.player.education} | 💼 {game.player.career} | 😊 {game.player.happiness}</p>
          </div>
          <div className="retro-panel p-3">
            <p className="pixel-text text-[8px] text-red-400 mb-1">JONES</p>
            <p className="font-mono text-sm">💰 ${game.aiJones.money} | 🎓 {game.aiJones.education} | 💼 {game.aiJones.career} | 😊 {game.aiJones.happiness}</p>
          </div>
        </div>
        <button
          onClick={() => { setGame(null); sessionStorage.removeItem("jones_game_id"); setActiveOfflineGameId(null); }}
          className="retro-btn mt-6 px-6 py-3 bg-green-700 hover:bg-green-800 text-lg"
        >
          ▶ PLAY AGAIN
        </button>
      </main>
    );
  }

  // Game in progress — no H1, GameBoard takes full viewport
  if (game) {
    return (
      <>
        <GameBoard game={game} onUpdate={setGame} onMessage={handleMessage} onRestart={handleRestart} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Start screen
  return (
    <main className="max-w-lg mx-auto p-8 text-center">
      {/* Title with character art */}
      <div className="flex items-end justify-center gap-6 mb-4">
        <img src={assetPath("assets/characters/player.png")} alt="Player" className="w-16 h-28 object-contain" style={{ imageRendering: "pixelated" }} />
        <div>
          <h1 className="pixel-text text-xl text-amber-400 leading-relaxed">JONES IN THE<br/>FAST LANE</h1>
          <p className="text-gray-400 text-sm mt-2">Race to your life goals before Jones does!</p>
        </div>
        <img src={assetPath("assets/characters/jones.png")} alt="Jones" className="w-16 h-28 object-contain" style={{ imageRendering: "pixelated" }} />
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full p-3 rounded retro-panel text-white font-mono focus:outline-none focus:border-cyan-500"
        />

        {/* Difficulty */}
        <div className="text-left">
          <label className="pixel-text text-[8px] text-gray-400 block mb-2">DIFFICULTY</label>
          <div className="grid grid-cols-3 gap-2">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setGoalSelection({ ...goalSelection, difficulty: d })}
                className={`retro-btn uppercase ${
                  goalSelection.difficulty === d
                    ? "bg-cyan-700 border-cyan-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 font-mono">
            💰${DIFFICULTY_GOALS[goalSelection.difficulty].money} | 🎓{DIFFICULTY_GOALS[goalSelection.difficulty].education} | 💼{DIFFICULTY_GOALS[goalSelection.difficulty].career} | 😊{DIFFICULTY_GOALS[goalSelection.difficulty].happiness}
          </p>
        </div>

        {/* Mode: Online (server) vs Offline (device-only) */}
        <div className="text-left">
          <label className="pixel-text text-[8px] text-gray-400 block mb-2">MODE</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOffline(false)}
              className={`retro-btn uppercase ${
                !offline
                  ? "bg-cyan-700 border-cyan-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              🌐 Online
            </button>
            <button
              onClick={() => setOffline(true)}
              className={`retro-btn uppercase ${
                offline
                  ? "bg-cyan-700 border-cyan-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              📴 Offline
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-mono">
            {offline
              ? "Play vs Jones on this device — no internet needed."
              : "Play vs Jones through the game server."}
          </p>
        </div>

        {/* Goal categories */}
        <div className="text-left">
          <label className="pixel-text text-[8px] text-gray-400 block mb-2">GOALS</label>
          <div className="grid grid-cols-2 gap-2">
            {(["money", "education", "career", "happiness"] as const).map((g) => (
              <label key={g} className="flex items-center gap-2 p-2 rounded retro-panel cursor-pointer hover:border-cyan-600 transition">
                <input
                  type="checkbox"
                  checked={goalSelection[g]}
                  onChange={() => setGoalSelection({ ...goalSelection, [g]: !goalSelection[g] })}
                  className="accent-cyan-500"
                />
                <span className="capitalize text-sm">{g}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleNewGame}
          disabled={!goalSelection.money && !goalSelection.education && !goalSelection.career && !goalSelection.happiness}
          className="retro-btn w-full p-3 bg-green-700 hover:bg-green-800 text-lg"
        >
          ▶ START GAME
        </button>

        <div className="border-t border-gray-700 pt-4">
          <input
            type="text"
            placeholder="Game ID (or auto-resume)"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="w-full p-3 rounded retro-panel text-white font-mono mb-2 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleResume}
            className="retro-btn w-full p-3 bg-gray-700 hover:bg-gray-600"
          >
            RESUME
          </button>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
