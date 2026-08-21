"use client";

import { useState, useEffect } from "react";
import { GameState } from "@jones/shared";
import { createGame, loadGame } from "@/lib/api";
import GameBoard from "@/components/GameBoard";

export default function Home() {
  const [game, setGame] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  // Auto-resume on mount
  useEffect(() => {
    const savedId = localStorage.getItem("jones_game_id");
    if (savedId) {
      loadGame(savedId)
        .then((g) => {
          if (g && g.status === "in_progress") {
            setGame(g);
            setMessages(["Game resumed from last session."]);
          }
        })
        .catch((err) => {
          console.error("Failed to resume game:", err);
        });
    }
  }, []);

  function addMessage(msg: string) {
    setMessages((prev) => [msg, ...prev].slice(0, 20));
  }

  async function handleNewGame() {
    const g = await createGame({ playerName: playerName || "Player" });
    setGame(g);
    setMessages([]);
    localStorage.setItem("jones_game_id", g.id);
  }

  async function handleResume() {
    const id = gameId || localStorage.getItem("jones_game_id");
    if (!id) return;
    const g = await loadGame(id);
    if (g) {
      setGame(g);
      addMessage("Game resumed!");
    } else {
      addMessage("❌ Game not found");
    }
  }

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
          onClick={() => { setGame(null); localStorage.removeItem("jones_game_id"); }}
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
        <GameBoard game={game} onUpdate={setGame} onMessage={addMessage} />

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
        <button
          onClick={handleNewGame}
          className="w-full p-3 rounded bg-blue-600 hover:bg-blue-700 font-semibold"
        >
          New Game
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
