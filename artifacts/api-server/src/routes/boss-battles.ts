import { Router } from "express";
import { db, bossBattlesTable, playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateBossBattleProgressBody, UpdateBossBattleProgressParams } from "@workspace/api-zod";
import { getOrCreatePlayer, updatePlayerXp, formatPlayer } from "./player";

const router = Router();

function fmt(b: typeof bossBattlesTable.$inferSelect) {
  return {
    ...b,
    expiresAt: b.expiresAt.toISOString(),
    completedAt: b.completedAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
  };
}

async function seedBossBattlesIfEmpty() {
  const existing = await db.select().from(bossBattlesTable);
  if (existing.length > 0) return;

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await db.insert(bossBattlesTable).values([
    {
      title: "7 Days No Junk Food",
      description: "Avoid all junk food for 7 consecutive days",
      category: "health",
      targetValue: 7,
      currentProgress: 0,
      xpReward: 500,
      coinReward: 200,
      badgeReward: "Iron Discipline",
      status: "active",
      expiresAt: nextWeek,
    },
    {
      title: "30-Day Workout Challenge",
      description: "Complete a workout session every day for 30 days",
      category: "body",
      targetValue: 30,
      currentProgress: 0,
      xpReward: 1000,
      coinReward: 500,
      badgeReward: "Iron Warrior",
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Complete One Book",
      description: "Finish reading an entire book",
      category: "knowledge",
      targetValue: 1,
      currentProgress: 0,
      xpReward: 300,
      coinReward: 150,
      badgeReward: "Book Slayer",
      status: "active",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  ]);
}

router.get("/boss-battles", async (req, res): Promise<void> => {
  await seedBossBattlesIfEmpty();
  const battles = await db.select().from(bossBattlesTable);
  res.json(battles.map(fmt));
});

router.patch("/boss-battles/:id/progress", async (req, res): Promise<void> => {
  const paramsParsed = UpdateBossBattleProgressParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const bodyParsed = UpdateBossBattleProgressBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const [battle] = await db
    .select()
    .from(bossBattlesTable)
    .where(eq(bossBattlesTable.id, paramsParsed.data.id));
  if (!battle) {
    res.status(404).json({ error: "Boss battle not found" });
    return;
  }

  const newProgress = Math.min(battle.currentProgress + bodyParsed.data.increment, battle.targetValue);
  const completed = newProgress >= battle.targetValue;

  const [updated] = await db
    .update(bossBattlesTable)
    .set({
      currentProgress: newProgress,
      status: completed ? "completed" : "active",
      completedAt: completed ? new Date() : null,
    })
    .where(eq(bossBattlesTable.id, battle.id))
    .returning();

  // Award XP on completion
  if (completed && battle.status !== "completed") {
    const player = await getOrCreatePlayer();
    if (player) {
      await updatePlayerXp(player, battle.xpReward);
      await db
        .update(playersTable)
        .set({ coins: player.coins + battle.coinReward })
        .where(eq(playersTable.id, player.id));
    }
  }

  res.json(fmt(updated));
});

export { router as bossBattlesRouter };
