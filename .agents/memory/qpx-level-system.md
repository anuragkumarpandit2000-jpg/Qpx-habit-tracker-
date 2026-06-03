---
name: QPX level system redesign
description: Rank is now tied to level (not totalXp thresholds); level-up requires XP + skills learned + chapters completed; Civilian is new rank 0.
---

## Rule
Rank index = level. RANKS[0]="Civilian", RANKS[1]="Recruit"…RANKS[10]="Titan".

Level-up triggers only when ALL THREE conditions are met:
1. `xp >= LEVEL_CONDITIONS[level].xp`
2. `skillsLearned >= LEVEL_CONDITIONS[level].skills`
3. `chaptersCompleted >= LEVEL_CONDITIONS[level].chapters`

**Why:** User explicitly wanted XP alone not to be sufficient; skills and chapters must be actively completed to earn the next rank.

## Key files
- `artifacts/api-server/src/lib/rpg-system.ts` — RANKS, LEVEL_CONDITIONS, computeLevelUp()
- `artifacts/api-server/src/routes/player.ts` — runMigration() (once on startup), updatePlayerXp(), POST /player/skill-learned, POST /player/chapter-completed
- `artifacts/qpx/src/components/rank-badge.tsx` — 11-item RANKS + RANK_COLORS (Civilian at index 0 = gray)
- `artifacts/qpx/src/pages/character.tsx` — Level-Up Rules section (local LEVEL_CONDITIONS copy)
- `artifacts/qpx/src/pages/skills.tsx` — tickSkill() calls /api/player/skill-learned with tier
- `artifacts/qpx/src/pages/chapter10.tsx` — tick() calls /api/player/chapter-completed

## DB migration (runs once on server startup)
- Adds `skills_learned` and `chapters_completed` INTEGER columns to players table
- Sets rank_index = level for all existing players
- Sets xp_to_next_level to new LEVEL_CONDITIONS XP threshold for each player's current level

## Skill XP tiers
- Beginner sections: 5 XP, 2 coins
- Intermediate sections: 10 XP, 5 coins
- Advanced sections: 20 XP, 10 coins
- Chapter completion: 8 XP, 3 coins

## New player creation
- level=0, xpToNextLevel=100, rankIndex=0 (Civilian), skillsLearned=0, chaptersCompleted=0
