# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- AI-generated pixel-art assets: 13 building icons, 2 character sprites, board background
- Image post-processing: background removal, edge softening, web-optimized resizing
- Board background image rendered behind the tile ring
- Character sprites replace colored circle markers on tiles
- Player vs Jones portraits in board center
- Action buttons with category emojis and color-coded borders
- Tile hover animations (scale, glow) and current-location pulse
- Character art on start screen and game-over screen
- Toast notifications on start screen (error toasts now visible everywhere)
- E2E test suite: 13 Playwright tests covering gameplay, game-over, resume, and duplicate-click protection
- Server unit tests (node:test): 3 tests for engine edge cases
- ESLint 9 config with TypeScript and React Hooks plugins
- CI workflow (GitHub Actions): lint, build, server tests, E2E tests
- `concurrently` for safe parallel dev server management
- Stale-process cleanup script (`scripts/kill-local-dev.mjs`) auto-runs on `npm run dev`
- Accessible action button labels for stable E2E selectors
- GameDialog component with keyboard (Escape) and backdrop-click dismissal

### Fixed
- CSP `connect-src` now allows `ws://localhost:3000` for HMR in dev mode
- Turbopack cache corruption recovery documented (rm -rf .next)
- Dev script no longer orphans background processes (was `&`, now `concurrently --kill-others-on-fail`)
- All async UI handlers wrapped in try/catch with error toasts
- `isSubmitting` guard prevents duplicate API calls from rapid clicks

### Changed
- Board ring layout: increased gap/padding for better tile spacing
- Tiles: larger icons (52px), full location names, drop-shadow text
- CenterStats: now shows player/jones character portraits with key vitals
- ActionButton: emoji + color-coded category borders, separate time/cost display
- LocationIcons: replaced SVG pixel grids with AI-generated PNG images
- Next.js dev mode now uses Turbopack (removed --webpack flag)

## [0.1.0] — 2026-08-21

### Added
- Monorepo scaffold: npm workspaces (packages/shared, apps/server, apps/client)
- Shared types: Player, GameState, Locations, Actions, Jobs, API contracts
- Express REST API: create, load, move, action, end-week endpoints
- Game engine: movement, action execution, end-of-week processing, win detection
- Hunger system: food depletes 25/week, starvation penalties (energy -30, happiness -10)
- 9-tier job ladder: Dishwasher ($15) → CEO ($200) with education requirements
- Firing mechanic: energy below 10 = lose your job
- 8 random events: mugged, found money, food poisoning, good mood, networking, inspiration, bills, bonus
- Goal selection at game start: pick which categories + difficulty (easy/medium/hard)
- AI Jones with 4 strategies (education_first, career_rush, money_grind, balanced)
- Next.js client: start screen, game board, location map, action panel, player HUD, log
- Session persistence: Redis-backed game state, auto-resume via sessionStorage
- Render deployment (server) with render.yaml
- Cloudflare Web Analytics
- Build number + bug report link in footer
- Content Security Policy headers

### Infrastructure
- Upstash Redis with `jones:game:` key prefix (shared instance)
