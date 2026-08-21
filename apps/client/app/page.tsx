"use client";

import { useState, useEffect, useCallback } from "react";
import { GameState, GoalSelection, Difficulty, DIFFICULTY_GOALS } from "@jones/shared";
import { createGame, loadGame } from "@/lib/api";
import GameBoard from "@/components/GameBoard";

export default function Home() {
  const [game, setGame] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [goalSelection, setGoalSelection] = useState<GoalSelection>({
    money: true,
    education: true,
    career: true,
    happiness: true,
    difficulty: "medium",
  });

  // Auto-resume on mount
  useEffect(() => {
    let cancelled = false;
    const savedId = sessionStorage.getItem("jones_game_id");
    if (savedId) {
      loadGame(savedId)
        .then((g) => {
          if (!cancelled && g && g.status === "in_progress") {
            setGame(g);
            setMessages(["Game resumed from last session."]);
          }
        })
        .catch((err) => {
          if (!cancelled) console.error("Failed to resume game:", err);
        });
    }
    return () => { cancelled = true; };
  }, []);

  const addMessage = useCallback((msg: string) => {
    setMessages((prev) => [msg, ...prev].slice(0, 20));
  }, []);

  async function handleNewGame() {
    const g = await createGame({ playerName: playerName || "Player", goalSelection });
    setGame(g);
    setMessages([]);
    sessionStorage.setItem("jones_game_id", g.id);
  }

  async function handleResume() {
    const id = gameId || sessionStorage.getItem("jones_game_id");
    if (!id) return;
    const g = await loadGame(id);
    if (g) {
      setGame(g);
      addMessage("Game resumed!");
    } else {
      addMessage("❌ Game not found");
    }
  }

  const handleRestart = useCallback(() => {
    setGame(null);
    setMessages([]);
    sessionStorage.removeItem("jones_game_id");
  }, []);

  // Game Over screen
  if (game && game.status !== "in_progress") {
    return (
      <main className="max-w-4xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">
          {game.status === "won" ? "🎉 You Win!" : "😞 Game Over"}
        </h1>
        <p className="text-gray-400 mb-4">
          {game.status === "won"
            ? "You reached all your goals before Jones!"
            : "Jones beat you to the finish line."}
        </p>
        <p className="text-lg">Final stats — Week {game.week}</p>
        <div className="grid grid-cols-2 gap-4 mt-4 max-w-md mx-auto text-left">
          <div className="bg-gray-800 rounded p-3">
            <p className="font-bold">{game.player.name}</p>
            <p>💰 ${game.player.money} | 🎓 {game.player.education} | 💼 {game.player.career} | 😊 {game.player.happiness}</p>
          </div>
          <div className="bg-gray-800 rounded p-3">
            <p className="font-bold">Jones</p>
            <p>💰 ${game.aiJones.money} | 🎓 {game.aiJones.education} | 💼 {game.aiJones.career} | 😊 {game.aiJones.happiness}</p>
          </div>
        </div>
        <button
          onClick={() => { setGame(null); sessionStorage.removeItem("jones_game_id"); }}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
        >
          Play Again
        </button>
      </main>
    );
  }

  // Game in progress
  if (game) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">🏃 Jones in the Fast Lane</h1>
        <GameBoard game={game} onUpdate={setGame} onMessage={addMessage} onRestart={handleRestart} />

        {/* Message Log */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700 max-h-40 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">📜 Log</h3>
          {messages.length === 0 && <p className="text-gray-500 text-sm">No events yet. Start playing!</p>}
          {messages.map((msg, i) => (
            <p key={i} className="text-sm text-gray-300">{msg}</p>
          ))}
        </div>
      </main>
    );
  }

  // Start screen
  return (
    <main className="max-w-md mx-auto p-8 text-center">
      <h1 className="text-4xl font-bold mb-2">🏃 Jones in the Fast Lane</h1>
      <p className="text-gray-400 mb-8">A modern remake — race to your life goals before Jones does!</p>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white"
        />

        {/* Difficulty */}
        <div className="text-left">
          <label className="text-sm text-gray-400 block mb-1">Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setGoalSelection({ ...goalSelection, difficulty: d })}
                className={`p-2 rounded border text-sm font-semibold capitalize ${
                  goalSelection.difficulty === d
                    ? "bg-blue-700 border-blue-500"
                    : "bg-gray-800 border-gray-700 hover:border-gray-500"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Targets: 💰${DIFFICULTY_GOALS[goalSelection.difficulty].money} | 🎓{DIFFICULTY_GOALS[goalSelection.difficulty].education} | 💼{DIFFICULTY_GOALS[goalSelection.difficulty].career} | 😊{DIFFICULTY_GOALS[goalSelection.difficulty].happiness}
          </p>
        </div>

        {/* Goal categories */}
        <div className="text-left">
          <label className="text-sm text-gray-400 block mb-1">Goals to pursue</label>
          <div className="grid grid-cols-2 gap-2">
            {(["money", "education", "career", "happiness"] as const).map((g) => (
              <label key={g} className="flex items-center gap-2 p-2 rounded bg-gray-800 border border-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={goalSelection[g]}
                  onChange={() => setGoalSelection({ ...goalSelection, [g]: !goalSelection[g] })}
                  className="accent-blue-500"
                />
                <span className="capitalize text-sm">{g}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleNewGame}
          className="w-full p-3 rounded bg-blue-600 hover:bg-blue-700 font-semibold"
        >
          Start Game
        </button>

        <div className="border-t border-gray-700 pt-4">
          <input
            type="text"
            placeholder="Game ID (or auto-resume)"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white mb-2"
          />
          <button
            onClick={handleResume}
            className="w-full p-3 rounded bg-gray-700 hover:bg-gray-600 font-semibold"
          >
            Resume Game
          </button>
        </div>
      </div>
    </main>
  );
}
