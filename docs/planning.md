# Jones in the Fast Lane — Remake Planning

## Overview

A modern remake of "Jones in the Fast Lane" (Sierra, 1991). A board-game-style life simulation where players compete to achieve goals in career, education, wealth, and happiness.

## References & Resources

### Forked Repos

**[openjones](https://github.com/geea-develop/openjones)** (forked from dimidd/openjones)
- Java / NetBeans project
- GUI-based single player
- 73 commits of prior work

**[Jones-In-The-Fast-Lane-Game-Java-2017](https://github.com/geea-develop/Jones-In-The-Fast-Lane-Game-Java-2017)** (forked from panaitescu-paul/Jones-In-The-Fast-Lane-Game-Java-2017)
- Java terminal-based (ASCII graphics in terminal)
- 8 buildings: University, Factory, Employment Office, Home, Bank, Rent Office, Pawn Shop, Monolith Burger
- Player stats: Money, Bank Account, Rest Energy, Food Energy
- Skills: Literature, Math, CS, Electronics, Robotics, Ind. Design
- Inventory items: Freezer, Clothes, Books, TV, Laptop
- Game tick progression, 8 maps, menu navigation
- 87 commits

### ScummVM (run the original)
- [ScummVM compatibility page](https://www.scummvm.org/compatibility/2026.1.0/sci:jones/)
- [ScummVM wiki — Jones in the Fast Lane](https://wiki.scummvm.org/index.php?title=Jones_in_the_Fast_Lane)

### Other References
- [Wikipedia](https://en.wikipedia.org/wiki/Jones_in_the_Fast_Lane)
- [MobyGames](https://www.mobygames.com/game/370)

### Internal Reference Projects
**[monopoly](https://github.com/geea-develop/monopoly)**
- Working multiplayer board game with multi-turn setup
- Reference for: DB setup, sessions, turn management, game state
- Can reuse patterns for player management, game loop, persistence

## Original Game — Key Mechanics

- **Board-style movement**: Players move around a town map visiting locations
- **Resources**: Money, time (turns), education, career level, happiness
- **Locations**: University, workplaces, stores, entertainment, rent office, etc.
- **Win condition**: First player to fill all chosen goal categories
- **Multiplayer**: 1-4 players (vs AI or local)
- **Turn-based**: Each player gets a set number of time units per week

## Scope — v1 POC

**Approach: Simple modernized remake — get the basics working first.**

## Scope

### v1 — Single Player POC
- Single town map with core locations (University, Work, Store, Home, Rent Office, Entertainment)
- Single player vs AI "Jones" (or solo goal-chasing without opponent)
- Turn-based: player gets time units per week to move and act
- Core stats: Money, Education, Career Level, Happiness
- Basic game loop: move → visit location → take action → end turn (week)
- Win condition: reach target thresholds in all goal categories before Jones does
- Persistent session — player can close browser and resume later
- Web-based (browser)
- Simple modernized UI (not pixel-faithful)

### v2 — Local Multiplayer
- Up to 4 players (hot-seat / local turn-based, like the original)
- Online multiplayer via WebSocket (reuse monopoly patterns)
- Invite links / game codes
- Smarter AI Jones opponent
- Full location set (8 buildings)
- Inventory / item system
- Sound effects, animations
- Mobile-friendly UI

## Tech Stack (simplified from monopoly — no real-time needed)

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Express, REST API, Node.js 20 |
| Database | Upstash Redis (session/game state persistence) |
| Shared | TypeScript — types, game data, constants |
| Monorepo | npm workspaces |
| Deploy | GitHub Pages (client), Render (server) |

> No WebSocket needed — single player with REST calls to save/load state.

## Architecture

```
jones-in-the-fast-lane-remake/
├── apps/
│   ├── client/          # Next.js — game UI, board, player HUD
│   └── server/          # Express + Socket.IO — game state, turns, rules
├── packages/
│   └── shared/          # Types, locations, stats, event contracts
├── docs/
│   ├── planning.md      # This file
│   └── adr/             # Architecture decisions
└── package.json         # npm workspaces root
```

## Game Model (v1 POC)

### Locations
| Location | Actions |
|----------|---------|
| University | Study (spend time → gain education) |
| Employment Office | Browse jobs (require education level) |
| Workplace | Work (spend time → earn money, requires job) |
| Store | Buy items (food, essentials) |
| Rent Office | Pay rent (weekly cost) |
| Entertainment | Spend money → gain happiness |
| Home | Rest (recover energy) |

### Player State
```typescript
interface Player {
  id: string;
  name: string;
  money: number;
  education: number;    // 0-100
  career: number;       // 0-100
  happiness: number;    // 0-100
  timeUnits: number;    // per turn
  position: Location;
  job: Job | null;
}
```

### Turn Flow
1. Player gets N time units for the week/turn
2. Player chooses a location to move to (costs time based on distance)
3. Player performs actions at that location (costs time/money)
4. When time runs out, week ends — rent deducted, new week starts
5. Game state auto-saved to server after each action (resume anytime)

### Win Condition
Reach target threshold in all goal categories (education, career, money, happiness).

### Session Persistence
- Player gets a session ID (stored in cookie/localStorage)
- Game state saved to Redis on each action
- On return, load state from Redis and resume where left off

## Next Steps

- [x] Collect reference links and forked repos
- [x] Review monopoly architecture for reuse
- [x] Define scope for v1 POC
- [ ] Scaffold monorepo (copy monopoly structure, strip game-specific logic)
- [ ] Implement shared types (Player, Location, Game state, events)
- [ ] Build server — game creation, join, turn loop
- [ ] Build client — simple board UI, player HUD, actions panel
- [ ] Playtest basic loop: move → act → end turn → win
