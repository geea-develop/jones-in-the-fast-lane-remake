# Jones in the Fast Lane — Remake

A modern web-based remake of the classic 1991 Sierra DOS game "Jones in the Fast Lane". Race against AI opponent Jones to achieve life goals (money, education, career, happiness) by navigating a ring-shaped board of locations.

## Play

```bash
npm install
npm run dev        # Server on :3001, Client on :3000
```

Open http://localhost:3000

If the frontend gets stuck (Turbopack cache corruption), run:
```bash
rm -rf apps/client/.next
npm run dev
```

The dev script auto-kills stale processes on ports 3000/3001 before starting.

## Testing

```bash
# Server unit tests
npm test --workspace=@jones/server

# End-to-end tests (Playwright)
npm run test:e2e:install   # one-time browser install
npm run test:e2e           # run all 13 E2E tests
npm run test:e2e:ui        # interactive UI mode

# Lint
npm run lint
```

The E2E suite starts or reuses the local frontend and backend automatically.

### Test Coverage

- **Core gameplay**: start game, render HUD, action dialogs, move locations, end week
- **Game over**: win/loss screens, Play Again reset
- **Resume flow**: auto-resume via sessionStorage, manual resume with game ID, invalid ID error
- **Duplicate click protection**: rapid clicks only trigger one API call

## Structure

```
apps/
  client/          — Next.js 16 frontend (React 19, Tailwind CSS)
    public/assets/ — AI-generated pixel-art game assets
      buildings/   — 13 location icons (256×256 PNG, transparent bg)
      characters/  — Player + Jones sprites (128×256 PNG, transparent bg)
      board-bg.png — Board background image (608×416)
  server/          — Express API + game engine
    test/          — Server unit tests (node:test)
packages/
  shared/          — Shared types, locations, actions, game constants
scripts/
  kill-local-dev.mjs — Stale process cleanup (auto-run by npm run dev)
docs/
  planning.md      — Design notes and references
  art-inspiration/ — Prompt templates used for asset generation
  reference-screenshots/ — Original game screenshots (reference only)
e2e/
  game.spec.ts     — Playwright E2E test suite
```

## Features

- 🎲 13-location ring board with distance-based movement
- 🤖 AI Jones with adaptive strategy (balanced, career rush, education first, money grind)
- 📊 4 goal categories: Money, Education, Career, Happiness
- 🎯 3 difficulty levels with adjustable goal targets
- 🍔 Survival mechanics: food, energy, happiness decay
- 🎲 Random events each week
- 🎨 AI-generated pixel-art assets (VGA-style building icons, character sprites, board background)
- 🖼️ Retro UI with scanlines, pixel fonts, chunky 3D buttons, and hover animations
- 🔒 Duplicate-click protection and graceful error handling
- 💾 Session persistence with auto-resume

## Tech Stack

- **Frontend**: Next.js 16 (Turbopack), React 19, Tailwind CSS, TypeScript
- **Backend**: Express, TypeScript, in-memory game state (Upstash Redis in prod)
- **Shared**: TypeScript package with game types and constants
- **Testing**: Playwright (E2E), node:test (server), ESLint 9
- **Dev tooling**: concurrently, stale-process cleanup, CI workflow
- **Deployment**: Render (Node 20)

## Legal Disclaimer

This is an independent, non-commercial fan project created as a tribute to the original game. It is **not** affiliated with, endorsed by, or associated with Sierra Entertainment, Activision Blizzard, or Microsoft.

No original Sierra assets, artwork, music, or code are used in this project. All game visuals and code are original creations. The gameplay mechanics are reimplemented from scratch as a homage to the original design.

**Jones in the Fast Lane** is a trademark of its respective owners. Reference screenshots in `docs/reference-screenshots/` are included solely for development reference under fair use and are not distributed as part of the playable game.

This project does not seek to copy, replace, or compete with the original product.

## References

- [Jones in the Fast Lane (Wikipedia)](https://en.wikipedia.org/wiki/Jones_in_the_Fast_Lane)
- [Original game on archive.org](https://archive.org/details/jones-in-the-fast-lane)
