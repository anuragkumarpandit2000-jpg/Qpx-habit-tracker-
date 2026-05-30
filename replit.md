# QPX — Quantum Progress Experience

A premium real-life RPG progression web app where you earn XP, level up, gain ranks (Recruit→Titan), complete daily quests, fight boss battles, journal your journey, and evolve your character.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (lib/db)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec at lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + framer-motion
- Charts: recharts
- Routing: wouter

## Where things live

- `lib/db/src/schema/` — all DB table definitions (player, quests, achievements, journal, boss-battles, inventory, seasons, progress-history, rank-history, daily-login)
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/api-zod/` — generated Zod schemas from spec
- `lib/api-client-react/` — generated React Query hooks from spec
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/api-server/src/lib/rpg-system.ts` — XP/level/rank calculation utilities
- `artifacts/qpx/src/pages/` — all frontend pages
- `artifacts/qpx/src/components/` — layout, rank-badge, xp-animation shared components
- `artifacts/qpx/src/index.css` — dark cyberpunk theme (CSS variables)

## Architecture decisions

- Single-player model: no authentication. One player row, `id=1`, created on onboarding.
- XP-based leveling: level XP requirements increase by 20 per level (100, 120, 140...). Ranks (0-9) based on totalXp milestones.
- RPG ranks: Recruit, Cadet, Trainee, Warrior, Elite Warrior, Champion, Legend, Master, Grandmaster, Titan — with metallic gradient colors.
- Onboarding is an 11-step questionnaire before the app is accessible.
- API routes auto-seed quests, achievements, boss battles, inventory, and seasons on first load.

## Product

- **Dashboard**: Today's quests with one-tap completion, XP/HP bars, daily login reward, recent achievements
- **Character**: Animated SVG character that visually evolves with each rank promotion
- **Quests**: Daily habit quests grouped by category (mind/body/knowledge/creation/etc.) with XP rewards
- **Achievements**: 15 achievements by rarity (common/rare/epic/legendary) with progress tracking
- **Journal**: Rich daily entries with mood, energy level, wins, lessons, goals
- **Stats**: recharts graphs — XP over time, radar chart by category, XP by category bar, rank history
- **Boss Battles**: Multi-day challenges with massive XP/coin rewards
- **Inventory**: Unlockable cosmetics (outfits, effects, frames, badges) by rank/level
- **Rewards**: 30-day daily login calendar with escalating rewards
- **Settings**: Profile customization with title selection

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `useClaimDailyLogin` hook takes `void` (no arguments) — not `{data: ...}`
- Hook query keys are named `getGet<Resource>QueryKey()` (double "Get" prefix)
- The `not-found.tsx` page lives at `artifacts/qpx/src/pages/not-found.tsx`
- Never use `console.log` in server code — use `req.log` (in handlers) or `logger` (outside request context)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
