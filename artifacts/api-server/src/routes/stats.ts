import { Router } from "express";
import { db, questsTable, achievementsTable, journalEntriesTable, rankHistoryTable, progressHistoryTable } from "@workspace/db";
import { eq, desc, count, sum } from "drizzle-orm";
import { getOrCreatePlayer } from "./player";

const router = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const player = await getOrCreatePlayer();
  if (!player) {
    res.status(404).json({ error: "No player found" });
    return;
  }

  const completedQuests = await db
    .select()
    .from(questsTable)
    .where(eq(questsTable.completed, true));

  const journalEntries = await db.select().from(journalEntriesTable);
  const unlockedAchievements = await db
    .select()
    .from(achievementsTable)
    .where(eq(achievementsTable.unlocked, true));
  const rankHistory = await db
    .select()
    .from(rankHistoryTable)
    .orderBy(rankHistoryTable.achievedAt);

  // Group quests by category
  const categoryMap: Record<string, { count: number; xp: number }> = {};
  for (const q of completedQuests) {
    if (!categoryMap[q.category]) categoryMap[q.category] = { count: 0, xp: 0 };
    categoryMap[q.category].count++;
    categoryMap[q.category].xp += q.xpReward;
  }

  const questsByCategory = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    count: data.count,
    xp: data.xp,
  }));

  const xpByCategory = questsByCategory.map((c) => ({
    category: c.category,
    count: c.xp,
    xp: c.xp,
  }));

  res.json({
    totalXp: player.totalXp,
    totalCoins: player.coins,
    totalQuestsCompleted: completedQuests.length,
    currentStreak: player.streak,
    longestStreak: player.longestStreak,
    totalJournalEntries: journalEntries.length,
    totalAchievementsUnlocked: unlockedAchievements.length,
    questsByCategory,
    xpByCategory,
    rankHistory: rankHistory.map((r) => ({
      rank: r.rank,
      achievedAt: r.achievedAt.toISOString(),
    })),
  });
});

router.get("/stats/progress-history", async (req, res): Promise<void> => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const history = await db
    .select()
    .from(progressHistoryTable)
    .orderBy(desc(progressHistoryTable.date))
    .limit(days);

  if (history.length === 0) {
    // Return mock starter data if no history
    const today = new Date();
    const points = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      points.push({
        date: d.toISOString().split("T")[0],
        xp: Math.floor(Math.random() * 20),
        level: 1,
        questsCompleted: 0,
      });
    }
    res.json(points);
    return;
  }

  res.json(
    history.reverse().map((h) => ({
      date: h.date,
      xp: h.xp,
      level: h.level,
      questsCompleted: h.questsCompleted,
    }))
  );
});

export { router as statsRouter };
