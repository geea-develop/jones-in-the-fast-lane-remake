# Release Notes

## v0.1.0 — Initial Scaffold (Current)

**Commit:** `c505831`

### Highlights
- 🏃 **Full game loop** — move, act, end week, compete against AI Jones
- 🍔 **Hunger system** — food depletes weekly, starving costs energy + happiness
- 💼 **9-tier job ladder** — Dishwasher → CEO, each requiring more education
- 🎲 **Random events** — mugged, found money, food poisoning, networking, and more
- 🎯 **Goal selection** — pick which categories + difficulty (easy/medium/hard)
- 🤖 **Smart AI Jones** — 4 strategies that adapt to game state
- 💾 **Session persistence** — Redis-backed, resume anytime
- 🚀 **Deployed** — Render (server) + local client

### Game Mechanics
- 7 locations: University, Employment, Workplace, Store, Rent Office, Entertainment, Home
- Player stats: Money, Education, Career, Happiness, Energy, Food
- Turn = 1 week with 10 time units to spend
- Actions cost time and money, grant stat gains
- Get fired if energy drops too low
- Win by reaching all selected goal thresholds before Jones

### Infrastructure
- Monorepo: npm workspaces (shared, server, client)
- Server: Express REST API on Render
- Client: Next.js 14 with Tailwind CSS
- Database: Upstash Redis (shared with other projects, prefixed keys)
- Cloudflare Web Analytics
- Build number + bug report link in footer
