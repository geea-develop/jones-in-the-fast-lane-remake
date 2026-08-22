# Jones in the Fast Lane — Remake

A modern web-based remake of the classic 1991 Sierra DOS game "Jones in the Fast Lane". Race against AI opponent Jones to achieve life goals (money, education, career, happiness) by navigating a ring-shaped board of locations.

## Play

```bash
npm install
npm run dev        # Server on :3001, Client on :3000
```

Open http://localhost:3000

## End-to-end tests

Install the Playwright browser once, then run the critical gameplay flows:

```bash
npm run test:e2e:install
npm run test:e2e
```

The suite starts or reuses the local frontend and backend automatically. Use
`npm run test:e2e:ui` when iterating on a scenario interactively.

## Structure

```
apps/
  client/          — Next.js 16 frontend (React 19, Tailwind CSS)
  server/          — Express API + game engine
packages/
  shared/          — Shared types, locations, actions, game constants
docs/
  planning.md      — Design notes and references
  reference-screenshots/  — Original game screenshots (reference only)
```

## Features

- 🎲 13-location ring board with distance-based movement
- 🤖 AI Jones with adaptive strategy (balanced, career rush, education first, money grind)
- 📊 4 goal categories: Money, Education, Career, Happiness
- 🎯 3 difficulty levels with adjustable goal targets
- 🍔 Survival mechanics: food, energy, happiness decay
- 🎲 Random events each week
- 🏃 Retro pixel-art aesthetic inspired by the original VGA style

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, TypeScript
- **Backend**: Express, TypeScript, in-memory game state
- **Shared**: TypeScript package with game types and constants
- **Deployment**: Render (Node 20)

## Legal Disclaimer

This is an independent, non-commercial fan project created as a tribute to the original game. It is **not** affiliated with, endorsed by, or associated with Sierra Entertainment, Activision Blizzard, or Microsoft.

No original Sierra assets, artwork, music, or code are used in this project. All game visuals and code are original creations. The gameplay mechanics are reimplemented from scratch as a homage to the original design.

**Jones in the Fast Lane** is a trademark of its respective owners. Reference screenshots in `docs/reference-screenshots/` are included solely for development reference under fair use and are not distributed as part of the playable game.

This project does not seek to copy, replace, or compete with the original product.

## References

- [Jones in the Fast Lane (Wikipedia)](https://en.wikipedia.org/wiki/Jones_in_the_Fast_Lane)
- [Original game on archive.org](https://archive.org/details/jones-in-the-fast-lane)
