import express from "express";
import cors from "cors";
import { gameRouter } from "./routes/game.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/game", gameRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = app.listen(PORT, () => {
  console.log(`🎮 Jones server running on http://localhost:${PORT}`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}; closing HTTP server...`);
  const forceExitTimer = setTimeout(() => {
    console.error("HTTP server did not close within 10 seconds; forcing exit");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();
  server.close((error) => {
    clearTimeout(forceExitTimer);
    if (error) {
      console.error("HTTP server shutdown failed", error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
