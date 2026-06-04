import { Router } from "express";
import { db, pool, playersTable, questsTable, rankHistoryTable, inventoryItemsTable, playerInventoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  UpdatePlayerProfileBody,
  CompleteOnboardingBody,
  AwardXpBody,
} from "@workspace/api-zod";
import {
  getRankIndex, computeLevelUp, getLevelUpCondition,
  RANKS, DEFAULT_QUESTS, ACHIEVEMENTS_SEED,
  SKILL_REWARDS, CHAPTER_REWARD,
} from "../lib/rpg-system";
import { achievementsTable } from "@workspace/db";

const router = Router();

// ── Rank → outfit auto-equip on promotion ─────────────────────────────────────
const RANK_OUTFIT_MAP: Record<number, string> = {
  0: "Recruit Uniform",   // Civilian
  1: "Recruit Uniform",   // Recruit
  2: "Cadet Armor",       // Cadet
  3: "Cadet Armor",       // Trainee
  4: "Warrior Plate",     // Warrior
  5: "Warrior Plate",     // Elite Warrior
  6: "Champion's Gear",   // Champion
  7: "Champion's Gear",   // Legend
  8: "Champion's Gear",   // Master
  9: "Titan Armor",       // Grandmaster
  10: "Titan Armor",      // Titan
};

async function autoEquipRankOutfit(newRankIndex: number) {
  const outfitName = RANK_OUTFIT_MAP[newRankIndex];
  if (!outfitName) return;

  const [item] = await db.select().from(inventoryItemsTable)
    .where(eq(inventoryItemsTable.name, outfitName));
  if (!item) return;

  if (!item.unlocked) {
    await db.update(inventoryItemsTable)
      .set({ unlocked: true })
      .where(eq(inventoryItemsTable.id, item.id));
  }

  if (!item.equipped) {
    await db.update(inventoryItemsTable)
      .set({ equipped: false })
      .where(eq(inventoryItemsTable.type, "outfit"));
    await db.update(inventoryItemsTable)
      .set({ equipped: true })
      .where(eq(inventoryItemsTable.id, item.id));
    const [inv] = await db.select().from(playerInventoryTable).limit(1);
    if (inv) {
      await db.update(playerInventoryTable)
        .set({ equippedOutfit: outfitName })
        .where(eq(playerInventoryTable.id, inv.id));
    }
  }
}

// ── Run DB migration once on startup ──────────────────────────────────────────
let migrated = false;
async function runMigration() {
  if (migrated) return;
  migrated = true;
  try {
    await pool.query(`
      ALTER TABLE players ADD COLUMN IF NOT EXISTS skills_learned INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE players ADD COLUMN IF NOT EXISTS chapters_completed INTEGER NOT NULL DEFAULT 0;
    `);
    // Sync rankIndex = level, and fix xpToNextLevel to new thresholds
    await pool.query(`
      UPDATE players SET
        rank_index = level,
        xp_to_next_level = CASE
          WHEN level = 0 THEN 100
          WHEN level = 1 THEN 200
          WHEN level = 2 THEN 350
          WHEN level = 3 THEN 550
          WHEN level = 4 THEN 800
          WHEN level = 5 THEN 1100
          WHEN level = 6 THEN 1500
          WHEN level = 7 THEN 2000
          WHEN level = 8 THEN 2600
          WHEN level = 9 THEN 3300
          ELSE 9999
        END;
    `);
  } catch (e) {
    console.error("Migration error:", e);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getOrCreatePlayer() {
  await runMigration();
  const existing = await db.select().from(playersTable).limit(1);
  return existing[0] ?? null;
}

async function updatePlayerXp(
  player: typeof playersTable.$inferSelect,
  xpGain: number,
  coinGain = 0
) {
  const newTotalXp = player.totalXp + xpGain;
  const currentXpInLevel = (player.xp ?? 0) + xpGain;
  const skillsLearned = player.skillsLearned ?? 0;
  const chaptersCompleted = player.chaptersCompleted ?? 0;

  const { levelsGained, newXpInLevel, newXpToNext } = computeLevelUp(
    player.level,
    currentXpInLevel,
    skillsLearned,
    chaptersCompleted
  );

  const newLevel = player.level + levelsGained;
  const newRankIndex = getRankIndex(newLevel);
  const leveledUp = levelsGained > 0;
  const rankPromoted = newRankIndex > (player.rankIndex ?? 0);
  const newCoins = (player.coins ?? 0) + coinGain;

  const [updated] = await db
    .update(playersTable)
    .set({
      totalXp: newTotalXp,
      xp: newXpInLevel,
      xpToNextLevel: newXpToNext,
      level: newLevel,
      rankIndex: newRankIndex,
      coins: newCoins,
    })
    .where(eq(playersTable.id, player.id))
    .returning();

  if (rankPromoted) {
    await db.insert(rankHistoryTable).values({ rank: RANKS[newRankIndex] });
    await autoEquipRankOutfit(newRankIndex);
  }

  return { player: updated, leveledUp, rankPromoted, newLevel, newRank: RANKS[newRankIndex] };
}

function formatPlayer(p: typeof playersTable.$inferSelect) {
  return {
    ...p,
    rank: RANKS[p.rankIndex] ?? "Civilian",
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt?.toISOString(),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get("/player/profile", async (req, res): Promise<void> => {
  const player = await getOrCreatePlayer();
  if (!player) { res.status(200).json(null); return; }
  res.json(formatPlayer(player));
});

router.patch("/player/profile", async (req, res): Promise<void> => {
  const parsed = UpdatePlayerProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const player = await getOrCreatePlayer();
  if (!player) { res.status(404).json({ error: "No player profile found" }); return; }
  const [updated] = await db
    .update(playersTable)
    .set(parsed.data)
    .where(eq(playersTable.id, player.id))
    .returning();
  res.json(formatPlayer(updated));
});

router.post("/player/onboarding", async (req, res): Promise<void> => {
  const parsed = CompleteOnboardingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const existing = await getOrCreatePlayer();
  if (existing) {
    const [updated] = await db
      .update(playersTable)
      .set({ username: parsed.data.username, primaryGoal: parsed.data.primaryGoal, onboardingComplete: true })
      .where(eq(playersTable.id, existing.id))
      .returning();
    res.status(201).json(formatPlayer(updated));
    return;
  }

  const condition = getLevelUpCondition(0);
  const playerId = `QPX-${Math.floor(1000 + Math.random() * 9000)}`;
  const [player] = await db
    .insert(playersTable)
    .values({
      username: parsed.data.username,
      playerId,
      primaryGoal: parsed.data.primaryGoal,
      onboardingComplete: true,
      level: 0,
      xp: 0,
      xpToNextLevel: condition.xp,
      totalXp: 0,
      hp: 100,
      maxHp: 100,
      coins: 50,
      streak: 0,
      longestStreak: 0,
      rankIndex: 0,
      skillsLearned: 0,
      chaptersCompleted: 0,
    })
    .returning();

  await db.insert(rankHistoryTable).values({ rank: "Civilian" });
  const { ACHIEVEMENTS_SEED: seeds } = await import("../lib/rpg-system");
  await db.insert(achievementsTable).values(seeds.map((a) => ({ ...a, progress: 0 })));
  const today = new Date().toISOString().split("T")[0];
  await db.insert(questsTable).values(DEFAULT_QUESTS.map((q) => ({ ...q, date: today, completed: false })));

  res.status(201).json(formatPlayer(player));
});

router.post("/player/xp", async (req, res): Promise<void> => {
  const parsed = AwardXpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const player = await getOrCreatePlayer();
  if (!player) { res.status(404).json({ error: "No player profile found" }); return; }
  const result = await updatePlayerXp(player, parsed.data.amount);
  res.json({
    player: formatPlayer(result.player),
    xpGained: parsed.data.amount,
    leveledUp: result.leveledUp,
    newLevel: result.newLevel,
    newRank: result.newRank,
    rankPromoted: result.rankPromoted,
  });
});

// ── Skill learned ─────────────────────────────────────────────────────────────
router.post("/player/skill-learned", async (req, res): Promise<void> => {
  const { tier = "beginner", undo = false } = req.body ?? {};
  const player = await getOrCreatePlayer();
  if (!player) { res.status(404).json({ error: "No player" }); return; }

  const currentCount = player.skillsLearned ?? 0;

  if (undo) {
    await db.update(playersTable)
      .set({ skillsLearned: Math.max(0, currentCount - 1) })
      .where(eq(playersTable.id, player.id));
    res.json({ ok: true, skillsLearned: Math.max(0, currentCount - 1) });
    return;
  }

  // Increment first, then award XP
  await db.update(playersTable)
    .set({ skillsLearned: currentCount + 1 })
    .where(eq(playersTable.id, player.id));

  const updatedPlayer = await getOrCreatePlayer();
  const reward = SKILL_REWARDS[tier as keyof typeof SKILL_REWARDS] ?? SKILL_REWARDS.beginner;
  const result = await updatePlayerXp(updatedPlayer!, reward.xp, reward.coins);

  res.json({
    player: formatPlayer(result.player),
    xpGained: reward.xp,
    coinsGained: reward.coins,
    leveledUp: result.leveledUp,
    newLevel: result.newLevel,
    newRank: result.newRank,
    rankPromoted: result.rankPromoted,
  });
});

// ── Chapter completed ─────────────────────────────────────────────────────────
router.post("/player/chapter-completed", async (req, res): Promise<void> => {
  const { undo = false } = req.body ?? {};
  const player = await getOrCreatePlayer();
  if (!player) { res.status(404).json({ error: "No player" }); return; }

  const currentCount = player.chaptersCompleted ?? 0;

  if (undo) {
    await db.update(playersTable)
      .set({ chaptersCompleted: Math.max(0, currentCount - 1) })
      .where(eq(playersTable.id, player.id));
    res.json({ ok: true, chaptersCompleted: Math.max(0, currentCount - 1) });
    return;
  }

  await db.update(playersTable)
    .set({ chaptersCompleted: currentCount + 1 })
    .where(eq(playersTable.id, player.id));

  const updatedPlayer = await getOrCreatePlayer();
  const result = await updatePlayerXp(updatedPlayer!, CHAPTER_REWARD.xp, CHAPTER_REWARD.coins);

  res.json({
    player: formatPlayer(result.player),
    xpGained: CHAPTER_REWARD.xp,
    coinsGained: CHAPTER_REWARD.coins,
    leveledUp: result.leveledUp,
    newLevel: result.newLevel,
    newRank: result.newRank,
    rankPromoted: result.rankPromoted,
  });
});

export { router as playerRouter, getOrCreatePlayer, updatePlayerXp, formatPlayer };
