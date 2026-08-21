# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

- GitHub Pages deployment for client
- UI/UX polish (clearer feedback, better layout)
- Game balance tuning

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
- Goal selection at game start: pick categories + difficulty (easy/medium/hard)
- AI Jones with 4 strategies (education_first, career_rush, money_grind, balanced)
- Next.js client: start screen, game board, location map, action panel, player HUD, log
- Session persistence: Redis-backed game state, auto-resume via localStorage
- Render deployment (server) with render.yaml
- Cloudflare Web Analytics
- Build number + bug report link in footer
- Content Security Policy headers
- MIT License

### Infrastructure
- Upstash Redis with `jones:game:` key prefix (shared instance)
- CSP allowing Cloudflare insights + API server
