---
name: QPX constants split pattern
description: Non-component data (RANKS, RANK_COLORS) must live in a plain .ts file, not co-exported from a .tsx component file.
---

Vite Fast Refresh requires all exports from a .tsx file to be React components. Exporting plain arrays/objects alongside components triggers the "Could not Fast Refresh" warning and forces full page reloads.

**Rule:** Put shared constants in `lib/rank-constants.ts` and import from there in both the component file and any consumer pages/components.

**Why:** Discovered when RANKS and RANK_COLORS were exported from rank-badge.tsx alongside the RankBadge component — Vite logged "RANKS export is incompatible" and forced full reload on every HMR update.

**How to apply:** Any time a .tsx file needs to export non-component data that other files use, extract it into a .ts constants file in lib/.
