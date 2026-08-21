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

app.listen(PORT, () => {
  console.log(`🎮 Jones server running on http://localhost:${PORT}`);
});
