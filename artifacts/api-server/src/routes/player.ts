import { Router } from "express";
import { db, playersTable, questsTable, rankHistoryTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  GetPlayerProfileResponse,
  UpdatePlayerProfileBody,
  CompleteOnboardingBody,
  AwardXpBody,
  AwardXpResponse,
} from "@workspace/api-zod";
import { getRankIndex, getLevelFromXp, RANKS, DEFAULT_QUESTS, ACHIEVEMENTS_SEED } from "../lib/rpg-system";
import { achievementsTable } from "@workspace/db";

const router = Router();

async function getOrCreatePlayer() {
  const existing = await db.select().from(playersTable).limit(1);
  return existing[0] ?? null;
}

async function updatePlayerXp(player: typeof playersTable.$inferSelect, xpGain: number) {
  const newTotalXp = player.totalXp + xpGain;
  const { level, xpInLevel, xpToNext } = getLevelFromXp(newTotalXp);
  const newRankIndex = getRankIndex(newTotalXp);
  const leveledUp = level > player.level;
  const rankPromoted = newRankIndex > player.rankIndex;

  const [updated] = await db
    .update(playersTable)
    .set({
      totalXp: newTotalXp,
      xp: xpInLevel,
      xpToNextLevel: xpToNext,
      level,
      rankIndex: newRankIndex,
    })
    .where(eq(playersTable.id, player.id))
    .returning();

  if (rankPromoted) {
    await db.insert(rankHistoryTable).values({
      rank: RANKS[newRankIndex],
    });
  }

  return { player: updated, leveledUp, rankPromoted, newLevel: level, newRank: RANKS[newRankIndex] };
}

function formatPlayer(p: typeof playersTable.$inferSelect) {
  return {
    ...p,
    rank: RANKS[p.rankIndex] ?? "Recruit",
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt?.toISOString(),
  };
}

router.get("/player/profile", async (req, res): Promise<void> => {
  const player = await getOrCreatePlayer();
  if (!player) {
    res.status(200).json(null);
    return;
  }
  const parsed = GetPlayerProfileResponse.safeParse(formatPlayer(player));
  res.json(parsed.success ? parsed.data : formatPlayer(player));
});

router.patch("/player/profile", async (req, res): Promise<void> => {
  const parsed = UpdatePlayerProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const player = await getOrCreatePlayer();
  if (!player) {
    res.status(404).json({ error: "No player profile found" });
    return;
  }
  const [updated] = await db
    .update(playersTable)
    .set(parsed.data)
    .where(eq(playersTable.id, player.id))
    .returning();
  res.json(formatPlayer(updated));
});

router.post("/player/onboarding", async (req, res): Promise<void> => {
  const parsed = CompleteOnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await getOrCreatePlayer();
  if (existing) {
    // Update existing player
    const [updated] = await db
      .update(playersTable)
      .set({
        username: parsed.data.username,
        primaryGoal: parsed.data.primaryGoal,
        onboardingComplete: true,
      })
      .where(eq(playersTable.id, existing.id))
      .returning();
    res.status(201).json(formatPlayer(updated));
    return;
  }

  const playerId = `QPX-${Math.floor(1000 + Math.random() * 9000)}`;
  const [player] = await db
    .insert(playersTable)
    .values({
      username: parsed.data.username,
      playerId,
      primaryGoal: parsed.data.primaryGoal,
      onboardingComplete: true,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      totalXp: 0,
      hp: 100,
      maxHp: 100,
      coins: 50,
      streak: 0,
      longestStreak: 0,
      rankIndex: 0,
    })
    .returning();

  // Seed rank history
  await db.insert(rankHistoryTable).values({ rank: "Recruit" });

  // Seed achievements
  const { ACHIEVEMENTS_SEED: seeds } = await import("../lib/rpg-system");
  await db.insert(achievementsTable).values(
    seeds.map((a) => ({ ...a, progress: 0 }))
  );

  // Seed today's quests
  const today = new Date().toISOString().split("T")[0];
  await db.insert(questsTable).values(
    DEFAULT_QUESTS.map((q) => ({ ...q, date: today, completed: false }))
  );

  res.status(201).json(formatPlayer(player));
});

router.post("/player/xp", async (req, res): Promise<void> => {
  const parsed = AwardXpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const player = await getOrCreatePlayer();
  if (!player) {
    res.status(404).json({ error: "No player profile found" });
    return;
  }
  const result = await updatePlayerXp(player, parsed.data.amount);
  const response = AwardXpResponse.safeParse({
    player: formatPlayer(result.player),
    xpGained: parsed.data.amount,
    leveledUp: result.leveledUp,
    newLevel: result.newLevel,
    newRank: result.newRank,
    rankPromoted: result.rankPromoted,
  });
  res.json(response.success ? response.data : {
    player: formatPlayer(result.player),
    xpGained: parsed.data.amount,
    leveledUp: result.leveledUp,
    newLevel: result.newLevel,
    newRank: result.newRank,
    rankPromoted: result.rankPromoted,
  });
});

export { router as playerRouter, getOrCreatePlayer, updatePlayerXp, formatPlayer };
