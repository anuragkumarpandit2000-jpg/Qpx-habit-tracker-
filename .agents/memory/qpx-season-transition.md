---
name: QPX Season Transition System
description: Architecture of the 6-season progression system and the cinematic transition trigger.
---

## Architecture

- **6 seasons** defined in `artifacts/qpx/src/lib/season-data.ts` (SEASON_DATA array) and `artifacts/api-server/src/lib/rpg-system.ts` (SEASON_RANKS, SEASON_FINAL_TITLES, getSeasonRank).
- `currentSeason` (integer, default 1) lives on the `players` table. Completing Season 6 advances to `currentSeason = 7` (post-game state).
- Each season has 11 levels (0 = Civilian, 1–10 = season-specific ranks). Reaching level 10 in any season = season completion.

## Server logic (player.ts: updatePlayerXp)

- `seasonCompleted = rankPromoted && newRankIndex >= 10 && currentSeasonNum <= 6`
- On completion: writes XP/level/rankIndex reset + `currentSeason++` + `title = SEASON_FINAL_TITLES[season-1]` in a second DB update, then fetches the advanced player.
- Returns extra fields: `seasonCompleted`, `completedSeason`, `nextSeason`, `seasonFinalRank`, `preAdvanceStats`, `achievedLevel`, `achievedRankIndex`.
- **Why achievedRankIndex/achievedLevel:** After season reset `result.player.rankIndex = 0`. Achievement checks in quests.ts need the PEAK rank (10), not the post-reset value. Always use `result.achievedRankIndex` / `result.achievedLevel` for achievement unlocking.

## Frontend (dashboard.tsx + season-transition.tsx)

- `handleCompleteQuest` casts result as `any`, checks `r.seasonCompleted`, populates 4 state vars (`showSeasonTransition`, `transitionCompletedSeason`, `transitionNextSeason`, `transitionStats`).
- `<SeasonTransition>` renders as `position: fixed, zIndex: 9999` — full-screen overlay.
- 7 phases (0-6), auto-advancing via `setTimeout` in a `useEffect` keyed on `phase`. Phase 6 waits for button click.
- Phase 3 triggers the book page flip: CSS `rotateY(0 → -180deg)` with `transformStyle: preserve-3d` + `backfaceVisibility: hidden` on inline styles (not Tailwind).
- Web Audio API used for 4 sound types (fanfare, page, reveal, reward) — wrapped in try/catch.
- Stars and particles are memoized with `useMemo` to prevent re-randomization on phase changes.

## Season banner in dashboard

- Uses `SEASON_DATA[(player.currentSeason ?? 1) - 1]` directly — does NOT depend on `useGetCurrentSeason` hook for display accuracy.
- `GET /seasons/current` now looks up the player's `currentSeason` and returns the matching season record (not just `active: true`).

**Why:** The seasons table `active` flag was only set for Season 1 at seed time; relying on it for a 6-season system would show the wrong season after transition.
